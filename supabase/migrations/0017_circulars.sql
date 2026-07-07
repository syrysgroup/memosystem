-- Restrict positions.named_role (the SG / Director Admin & Finance / Head of
-- HR executive-authority tags) to admin only — ordinary oversight-based
-- position management (see positions_write in 0015_rls.sql) should not be
-- able to grant itself Circular-approval or supersession authority.
create or replace function enforce_named_role_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.named_role is distinct from old.named_role and not is_admin() then
    raise exception 'Only an admin may set positions.named_role';
  end if;
  return new;
end;
$$;

create trigger positions_named_role_admin_only before update on positions
  for each row execute function enforce_named_role_admin_only();

create or replace function enforce_named_role_admin_only_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.named_role is not null and not is_admin() then
    raise exception 'Only an admin may set positions.named_role';
  end if;
  return new;
end;
$$;

create trigger positions_named_role_admin_only_insert before insert on positions
  for each row execute function enforce_named_role_admin_only_insert();

-- Additive supersession only: never touches decision_status/decision_summary/
-- decision_number. The original decision remains permanent history —
-- "approved, then superseded" (spec section 9).
create or replace function supersede_circular(p_document_id uuid, p_reason text)
returns documents language plpgsql security definer set search_path = public as $$
declare
  v_position_id uuid;
  v_doc documents;
begin
  select id into v_position_id from positions
  where profile_id = auth.uid() and end_date is null and named_role = 'sg'
  limit 1;

  if v_position_id is null and not is_admin() then
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
