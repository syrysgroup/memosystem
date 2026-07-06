-- Helper functions used by RLS policies and app-facing RPCs.

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function is_registry_officer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'registry_officer' and is_active
  );
$$;

create or replace function current_user_org_unit()
returns uuid language sql stable security definer set search_path = public as $$
  select org_unit_id from profiles where id = auth.uid();
$$;

-- root and every org unit beneath it, so a directorate/division head's oversight
-- covers all offices in their span, not just their own row.
create or replace function org_unit_descendants(root uuid)
returns table (id uuid) language sql stable security definer set search_path = public as $$
  with recursive tree as (
    select ou.id from org_units ou where ou.id = root
    union all
    select ou.id from org_units ou join tree t on ou.parent_id = t.id
  )
  select id from tree;
$$;

-- True if the caller can create/update documents currently sitting in target_org_unit:
-- either they work there and aren't on leave, an active delegation covers it, or they're an admin.
create or replace function has_write_access(target_org_unit uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or exists (
      select 1 from profiles
      where id = auth.uid() and is_active and not on_leave and org_unit_id = target_org_unit
    )
    or exists (
      select 1 from delegations
      where delegate_user_id = auth.uid()
        and org_unit_id = target_org_unit
        and status = 'active'
        and current_date between start_date and end_date
    );
$$;

-- True if the caller may read a document that originated in origin_org_unit and
-- currently sits in current_org_unit: own office, an ancestor office (oversight),
-- registry (needs org-wide visibility to answer visitor inquiries), or admin.
create or replace function has_read_access(origin_org_unit uuid, current_org_unit uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or is_registry_officer()
    or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id in (origin_org_unit, current_org_unit));
$$;

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_touch_updated_at
  before update on documents
  for each row execute function touch_updated_at();

-- Reference code generation: PREFIX/ORGCODE/YEAR/SEQ, sequence scoped per
-- prefix+org+year. The counter table has no direct grants; it is only
-- reachable through this security-definer function.
create table document_code_counters (
  code_prefix text not null,
  org_code text not null,
  year int not null,
  last_seq int not null default 0,
  primary key (code_prefix, org_code, year)
);
revoke all on document_code_counters from authenticated;

create or replace function next_reference_code(p_prefix text, p_org_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from now());
  v_seq int;
begin
  insert into document_code_counters (code_prefix, org_code, year, last_seq)
  values (p_prefix, p_org_code, v_year, 1)
  on conflict (code_prefix, org_code, year)
    do update set last_seq = document_code_counters.last_seq + 1
  returning last_seq into v_seq;

  return p_prefix || '/' || p_org_code || '/' || v_year || '/' || lpad(v_seq::text, 4, '0');
end;
$$;

create or replace function set_document_reference_code()
returns trigger language plpgsql as $$
declare
  v_prefix text;
  v_org_code text;
begin
  if new.reference_code is not null then
    return new;
  end if;

  select code_prefix into v_prefix from document_types where id = new.document_type_id;
  select code into v_org_code from org_units where id = new.origin_org_unit_id;

  new.reference_code := next_reference_code(v_prefix, v_org_code);
  return new;
end;
$$;

create trigger documents_set_reference_code
  before insert on documents
  for each row execute function set_document_reference_code();

-- Keep documents.current_org_unit_id in sync with the latest movement, and
-- clear the custodian so the receiving office explicitly claims it.
create or replace function apply_document_movement()
returns trigger language plpgsql as $$
begin
  update documents
  set current_org_unit_id = new.to_org_unit_id,
      current_custodian_id = null
  where id = new.document_id;
  return new;
end;
$$;

create trigger document_movements_apply
  after insert on document_movements
  for each row execute function apply_document_movement();

-- Generic audit trigger. If the app is acting on behalf of someone on leave,
-- it sets memo.acting_as to that user's profile id for the transaction first.
create or replace function audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_acting_as uuid;
begin
  begin
    v_acting_as := nullif(current_setting('memo.acting_as', true), '')::uuid;
  exception when others then
    v_acting_as := null;
  end;

  insert into audit_log (user_id, acting_as_user_id, action, entity_type, entity_id, before, after)
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
create trigger document_movements_audit after insert or update or delete on document_movements
  for each row execute function audit_row_change();
create trigger delegations_audit after insert or update or delete on delegations
  for each row execute function audit_row_change();
create trigger document_external_meta_audit after insert or update or delete on document_external_meta
  for each row execute function audit_row_change();
