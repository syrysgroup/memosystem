-- Document creation: mint the immutable code, compute requester_tier, and
-- default both custody pointers to the originator (physical custody starts
-- with the originator too — nothing has been dispatched yet).

create table document_code_counters (
  origin_prefix text not null,
  doc_type_code text not null,
  year int not null,
  last_seq int not null default 0,
  primary key (origin_prefix, doc_type_code, year)
);
revoke all on document_code_counters from authenticated;

create or replace function next_unique_code(p_origin_prefix text, p_doc_type_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from now());
  v_seq int;
begin
  insert into document_code_counters (origin_prefix, doc_type_code, year, last_seq)
  values (p_origin_prefix, p_doc_type_code, v_year, 1)
  on conflict (origin_prefix, doc_type_code, year)
    do update set last_seq = document_code_counters.last_seq + 1
  returning last_seq into v_seq;

  return p_origin_prefix || '-' || p_doc_type_code || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

create or replace function current_prefix_for_org_unit(p_org_unit_id uuid, p_as_of timestamptz default now())
returns text language sql stable security definer set search_path = public as $$
  select prefix from prefix_decode_table
  where org_unit_id = p_org_unit_id
    and effective_from <= p_as_of
    and (effective_to is null or effective_to > p_as_of)
  order by effective_from desc
  limit 1;
$$;

create or replace function prepare_new_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role position_role;
  v_org_unit_id uuid;
  v_prefix text;
  v_doc_type_code text;
begin
  select role, org_unit_id into v_role, v_org_unit_id from positions where id = new.originating_position_id;
  new.requester_tier := requester_tier_for_role(v_role);

  select code into v_doc_type_code from document_types where id = new.document_type_id;
  v_prefix := current_prefix_for_org_unit(v_org_unit_id);
  if v_prefix is null then
    raise exception 'No active prefix_decode_table entry for org unit %; cannot mint unique_code', v_org_unit_id;
  end if;

  if new.unique_code is null then
    new.unique_code := next_unique_code(v_prefix, v_doc_type_code);
  end if;

  new.current_digital_custodian_id := coalesce(new.current_digital_custodian_id, new.originating_position_id);
  new.current_physical_custodian_id := coalesce(new.current_physical_custodian_id, new.originating_position_id);
  return new;
end;
$$;

create trigger documents_prepare_new before insert on documents
  for each row execute function prepare_new_document();

-- Log the origination movement (from_position_id null) right after creation.
create or replace function log_document_origination()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into movement_events (document_id, channel, from_position_id, to_position_id, cause, resulting_digital_status, recorded_by)
  values (new.id, 'digital', null, new.current_digital_custodian_id, 'normal', new.digital_status, auth.uid());
  return new;
end;
$$;

create trigger documents_log_origination after insert on documents
  for each row execute function log_document_origination();

-- Authorization + invariants on every update. Because this runs BEFORE the
-- row is written, has_write_access_digital/physical(old.id) still see the
-- pre-update custodian — so the check is always against whoever currently
-- (pre-change) holds that axis, never the value being written.
create or replace function enforce_document_update_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.unique_code is distinct from old.unique_code then
    raise exception 'unique_code is immutable';
  end if;
  if new.requester_tier is distinct from old.requester_tier then
    raise exception 'requester_tier is immutable';
  end if;
  if new.originating_position_id is distinct from old.originating_position_id then
    raise exception 'originating_position_id is immutable';
  end if;

  if (new.digital_status is distinct from old.digital_status)
     or (new.current_digital_custodian_id is distinct from old.current_digital_custodian_id)
  then
    if not has_write_access_digital(old.id) then
      raise exception 'Not authorized to change digital fields on this document';
    end if;
  end if;

  if (new.decision_status is distinct from old.decision_status)
     or (new.decision_summary is distinct from old.decision_summary)
     or (new.decision_number is distinct from old.decision_number)
  then
    -- Once a decision is terminal it is permanent — no peer override, not
    -- even by the same authority. A Circular can only be superseded (see
    -- supersede_circular in 0017_circulars.sql), which never touches these
    -- columns.
    if old.decision_status in ('approved', 'rejected', 'withdrawn') then
      raise exception 'decision_status is immutable once decided; use supersede_circular() for Circulars instead';
    end if;

    -- The open -> pending_decision flip is automatic bookkeeping (triggered
    -- by the first minute, see on_minute_inserted below), not an actual
    -- decision — it needs no special authority, unlike a real terminal
    -- decision (approved/rejected/withdrawn).
    if not (old.decision_status = 'open' and new.decision_status = 'pending_decision') then
      if not has_decision_authority(old.id) then
        raise exception 'Not authorized to decide this document';
      end if;
    end if;
  end if;

  if new.superseded_at is distinct from old.superseded_at then
    if old.superseded_at is not null then
      raise exception 'A document can only be superseded once';
    end if;
    if not (is_admin() or exists (
      select 1 from positions p where p.profile_id = auth.uid() and p.end_date is null and p.named_role = 'sg'
    )) then
      raise exception 'Only the SG may supersede a Circular';
    end if;
  end if;

  if (new.physical_status is distinct from old.physical_status)
     or (new.current_physical_custodian_id is distinct from old.current_physical_custodian_id)
  then
    if not has_write_access_physical(old.id) then
      raise exception 'Not authorized to change physical fields on this document';
    end if;
    if new.physical_status = 'delivery_failed' and new.physical_failure_reason is null then
      raise exception 'physical_failure_reason is required when physical_status is delivery_failed';
    end if;
    if new.physical_failure_reason = 'other' and new.physical_failure_note is null then
      raise exception 'physical_failure_note is required when physical_failure_reason is other';
    end if;
    if new.physical_status <> 'delivery_failed' then
      new.physical_failure_reason := null;
      new.physical_failure_note := null;
    end if;
  end if;

  -- Deciding is one action: reaching a terminal decision_status also closes
  -- out the digital track and freezes the days_in_system clock.
  if new.decision_status in ('approved', 'rejected', 'withdrawn') and old.decision_status not in ('approved', 'rejected', 'withdrawn') then
    new.decided_at := now();
    new.digital_status := 'decided';
  end if;

  -- is_closed is derived, never directly settable.
  new.is_closed := (new.physical_status = 'delivered' and new.decision_status in ('approved', 'rejected', 'withdrawn'));

  new.updated_at := now();
  return new;
end;
$$;

create trigger documents_enforce_update before update on documents
  for each row execute function enforce_document_update_rules();

-- After the write succeeds, log whatever actually changed as history.
create or replace function log_document_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.digital_status is distinct from old.digital_status)
     or (new.current_digital_custodian_id is distinct from old.current_digital_custodian_id)
     or (new.decision_status is distinct from old.decision_status)
  then
    insert into movement_events (
      document_id, channel, from_position_id, to_position_id, cause, resulting_digital_status, resulting_decision_status, recorded_by
    ) values (
      new.id, 'digital', old.current_digital_custodian_id, new.current_digital_custodian_id,
      case when new.decision_status is distinct from old.decision_status then 'decision_stamp'::movement_cause else 'normal'::movement_cause end,
      case when new.digital_status is distinct from old.digital_status then new.digital_status else null end,
      case when new.decision_status is distinct from old.decision_status then new.decision_status else null end,
      auth.uid()
    );
  end if;

  if (new.physical_status is distinct from old.physical_status)
     or (new.current_physical_custodian_id is distinct from old.current_physical_custodian_id)
  then
    insert into movement_events (
      document_id, channel, from_position_id, to_position_id, cause,
      delivery_outcome, failure_reason, failure_note, resulting_physical_status, recorded_by
    ) values (
      new.id, 'physical', old.current_physical_custodian_id, new.current_physical_custodian_id, 'normal',
      case when new.physical_status = 'delivered' then 'delivered'::delivery_outcome
           when new.physical_status = 'delivery_failed' then 'failed'::delivery_outcome
           else null end,
      new.physical_failure_reason, new.physical_failure_note, new.physical_status, auth.uid()
    );
  end if;

  return new;
end;
$$;

create trigger documents_log_update after update on documents
  for each row execute function log_document_update();

-- First minute entry auto-opens the decision clock (open -> pending_decision).
create or replace function on_minute_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update documents set decision_status = 'pending_decision'
  where id = new.document_id and decision_status = 'open';
  return new;
end;
$$;

create trigger minutes_after_insert after insert on minutes
  for each row execute function on_minute_inserted();

-- Auto-extension: at most 30 days per call, hard-capped at 90 days total
-- lifetime (original grant length + all extensions combined).
create or replace function grant_auto_extend(p_grant_id uuid)
returns grants language plpgsql security definer set search_path = public as $$
declare
  v_grant grants;
  v_remaining int;
  v_add int;
begin
  select * into v_grant from grants where id = p_grant_id for update;
  if v_grant is null then
    raise exception 'Grant % not found', p_grant_id;
  end if;
  if v_grant.status <> 'active' or v_grant.expires_at <= now() then
    raise exception 'Grant is not active; a fresh grant must be issued instead of extending this one';
  end if;

  v_remaining := 90 - v_grant.original_length_days - v_grant.total_extension_days;
  if v_remaining <= 0 then
    raise exception 'Grant has reached its 90-day cumulative cap; issue a new grant instead';
  end if;

  v_add := least(30, v_remaining);
  update grants
  set expires_at = expires_at + make_interval(days => v_add),
      total_extension_days = total_extension_days + v_add
  where id = p_grant_id
  returning * into v_grant;

  return v_grant;
end;
$$;

-- Generic immutable audit trigger, same pattern as before, now attributing
-- delegate-performed actions to the original position they're acting for.
create or replace function audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_acting_as uuid;
begin
  begin
    v_acting_as := nullif(current_setting('memo.acting_as_position', true), '')::uuid;
  exception when others then
    v_acting_as := null;
  end;

  insert into audit_log (user_id, acting_as_position_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    v_acting_as,
    lower(TG_TABLE_NAME) || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger documents_audit after insert or update or delete on documents
  for each row execute function audit_row_change();
create trigger movement_events_audit after insert on movement_events
  for each row execute function audit_row_change();
create trigger minutes_audit after insert or update or delete on minutes
  for each row execute function audit_row_change();
create trigger delegations_audit after insert or update or delete on delegations
  for each row execute function audit_row_change();
create trigger grants_audit after insert or update or delete on grants
  for each row execute function audit_row_change();
create trigger positions_audit after insert or update or delete on positions
  for each row execute function audit_row_change();
