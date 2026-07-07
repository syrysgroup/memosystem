-- Splits the single is_admin boolean into two narrower, independent claims:
-- org_admin (org units, positions, document types minus decision authority —
-- HR's scope) and security_admin (audit grants, positions.named_role,
-- document_types.decision_authority_role, Circular supersession — SG's
-- scope). is_admin remains the true bootstrap superadmin and is folded into
-- both narrower checks (so the first admin isn't locked out of anything),
-- but every policy below now names the specific claim it actually needs
-- instead of the generic one — an org_admin (HR) cannot issue audit grants
-- just because the sidebar doesn't show them the button; the RLS policy
-- itself no longer accepts is_admin as a bypass for that action.

alter table profiles add column is_org_admin boolean not null default false;
alter table profiles add column is_security_admin boolean not null default false;

create or replace function is_org_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from profiles where id = auth.uid() and is_org_admin and is_active);
$$;

create or replace function is_security_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from profiles where id = auth.uid() and is_security_admin and is_active);
$$;

revoke execute on function is_org_admin() from public;
revoke execute on function is_security_admin() from public;
grant execute on function is_org_admin() to authenticated;
grant execute on function is_security_admin() to authenticated;

-- org_units / prefix_decode_table: HR's org_admin scope.
drop policy org_units_write on org_units;
create policy org_units_write on org_units for all to authenticated
  using (is_org_admin()) with check (is_org_admin());

drop policy prefix_decode_select on prefix_decode_table;
drop policy prefix_decode_write on prefix_decode_table;
create policy prefix_decode_select on prefix_decode_table for select to authenticated using (is_org_admin());
create policy prefix_decode_write on prefix_decode_table for all to authenticated
  using (is_org_admin()) with check (is_org_admin());

-- positions: org_admin can manage any Position org-wide, additive to the
-- existing line-manager self-service (oversees_org_unit) — HR doesn't need
-- to head every unit to be able to onboard/offboard staff into it.
drop policy positions_write on positions;
create policy positions_write on positions for all to authenticated
  using (oversees_org_unit(org_unit_id) or is_org_admin())
  with check (oversees_org_unit(org_unit_id) or is_org_admin());

-- document_types: org_admin or security_admin may write generally; only
-- security_admin may touch decision_authority_role specifically (RLS is
-- row-level, so that column-level split is enforced by the trigger below).
drop policy document_types_write on document_types;
create policy document_types_write on document_types for all to authenticated
  using (is_org_admin() or is_security_admin())
  with check (is_org_admin() or is_security_admin());

create or replace function enforce_decision_authority_role_security_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.decision_authority_role <> array['current_custodian']::text[] and not is_security_admin() then
      raise exception 'Only a security admin may set document_types.decision_authority_role to anything beyond the default';
    end if;
  else
    if new.decision_authority_role is distinct from old.decision_authority_role and not is_security_admin() then
      raise exception 'Only a security admin may change document_types.decision_authority_role';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function enforce_decision_authority_role_security_admin_only() from public;

create trigger document_types_decision_authority_security_admin_only
  before insert or update on document_types
  for each row execute function enforce_decision_authority_role_security_admin_only();

-- positions.named_role grants Circular decision authority — that's SG's
-- security_admin scope, not a generic admin action.
create or replace function enforce_named_role_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.named_role is distinct from old.named_role and not is_security_admin() then
    raise exception 'Only a security admin may set positions.named_role';
  end if;
  return new;
end;
$$;

create or replace function enforce_named_role_admin_only_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.named_role is not null and not is_security_admin() then
    raise exception 'Only a security admin may set positions.named_role';
  end if;
  return new;
end;
$$;

-- Circular supersession is decision-authority-adjacent — same scope.
create or replace function supersede_circular(p_document_id uuid, p_reason text)
returns documents language plpgsql security definer set search_path = public as $$
declare
  v_position_id uuid;
  v_doc documents;
begin
  select id into v_position_id from positions
  where profile_id = auth.uid() and end_date is null and named_role = 'sg'
  limit 1;

  if v_position_id is null and not is_security_admin() then
    raise exception 'Only the SG may supersede a Circular';
  end if;

  select * into v_doc from documents where id = p_document_id;
  if v_doc is null then
    raise exception 'Document % not found', p_document_id;
  end if;
  if v_doc.decision_status <> 'approved' then
    raise exception 'Only an approved Circular can be superseded';
  end if;

  update documents
  set superseded_at = now(), superseded_reason = p_reason, superseded_by_position_id = v_position_id
  where id = p_document_id
  returning * into v_doc;

  return v_doc;
end;
$$;

-- Same scope, mirrored in the direct-update trigger path (defense in depth
-- alongside supersede_circular() itself).
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
    if old.decision_status in ('approved', 'rejected', 'withdrawn') then
      raise exception 'decision_status is immutable once decided; use supersede_circular() for Circulars instead';
    end if;

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
    if not (is_security_admin() or exists (
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

  if new.decision_status in ('approved', 'rejected', 'withdrawn') and old.decision_status not in ('approved', 'rejected', 'withdrawn') then
    new.decided_at := now();
    new.digital_status := 'decided';
  end if;

  new.is_closed := (new.physical_status = 'delivered' and new.decision_status in ('approved', 'rejected', 'withdrawn'));

  new.updated_at := now();
  return new;
end;
$$;

-- Audit grant issuance/visibility and audit trail visibility: security_admin's
-- scope specifically — an org_admin (HR) must not be able to issue or see
-- grants just because they can manage positions.
drop policy grants_select on grants;
create policy grants_select on grants for select to authenticated using (
  is_security_admin() or grantee_profile_id = auth.uid()
);

drop policy grants_write on grants;
create policy grants_write on grants for all to authenticated
  using (is_security_admin()) with check (is_security_admin());

drop policy audit_log_select on audit_log;
create policy audit_log_select on audit_log for select to authenticated using (is_security_admin());

-- ---------------------------------------------------------------------
-- Registry-only origination for external-correspondence document types
-- (Incoming/Outgoing Letter, document_types.is_external_correspondence).
-- "Any Position can log external correspondence" was the regression —
-- lock it to positions at an org unit explicitly flagged as Registry,
-- enforced in the same BEFORE INSERT trigger that mints the unique_code,
-- not just by hiding the form.
-- ---------------------------------------------------------------------

alter table org_units add column is_registry boolean not null default false;

create or replace function prepare_new_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role position_role;
  v_org_unit_id uuid;
  v_prefix text;
  v_doc_type_code text;
  v_is_external boolean;
  v_is_registry boolean;
begin
  select role, org_unit_id into v_role, v_org_unit_id from positions where id = new.originating_position_id;
  new.requester_tier := requester_tier_for_role(v_role);

  select code, is_external_correspondence into v_doc_type_code, v_is_external
  from document_types where id = new.document_type_id;

  if v_is_external then
    select is_registry into v_is_registry from org_units where id = v_org_unit_id;
    if not coalesce(v_is_registry, false) then
      raise exception 'Only a Registry position may originate this document type';
    end if;
  end if;

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

-- Demo data: mark the seeded Registry Office as an actual Registry, and mirror
-- the org_admin/security_admin split onto the demo HR/SG accounts per their
-- real-world responsibilities (see README "Demo accounts").
update org_units set is_registry = true where id = '1e693d75-2bec-4fb4-b762-d70cb382f194';
update profiles set is_org_admin = true where id = '05af06aa-4227-44dd-b4c0-d12ada6b25cb'; -- demo.hr
update profiles set is_security_admin = true where id = '4ec49df2-a7b2-4fc6-bd2c-aca1ef736207'; -- demo.sg
