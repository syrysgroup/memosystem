-- Row Level Security. Supabase's default privilege grants already let the
-- `authenticated` role attempt these statements; these policies decide which
-- rows are actually visible/writable.

alter table org_units enable row level security;
alter table profiles enable row level security;
alter table delegations enable row level security;
alter table document_types enable row level security;
alter table documents enable row level security;
alter table document_external_meta enable row level security;
alter table document_movements enable row level security;
alter table document_attachments enable row level security;
alter table audit_log enable row level security;
alter table document_code_counters enable row level security;

-- org_units: everyone needs the org chart to route documents; only admins edit it.
create policy org_units_select on org_units for select to authenticated using (true);
create policy org_units_write on org_units for all to authenticated
  using (is_admin()) with check (is_admin());

-- profiles: readable org-wide (staff directory for the comms/sharing module);
-- editable by the user themself, their oversight chain, or an admin.
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated
  using (
    id = auth.uid()
    or is_admin()
    or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = profiles.org_unit_id)
  )
  with check (
    id = auth.uid()
    or is_admin()
    or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = profiles.org_unit_id)
  );
create policy profiles_insert on profiles for insert to authenticated with check (is_admin());

-- delegations: visible to the two people involved and their oversight chain;
-- only that oversight chain (or admin) may create/end one.
create policy delegations_select on delegations for select to authenticated using (
  absent_user_id = auth.uid()
  or delegate_user_id = auth.uid()
  or is_admin()
  or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = delegations.org_unit_id)
);
create policy delegations_write on delegations for all to authenticated
  using (
    is_admin()
    or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = delegations.org_unit_id)
  )
  with check (
    is_admin()
    or exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = delegations.org_unit_id)
  );

-- document_types: shared reference data.
create policy document_types_select on document_types for select to authenticated using (true);
create policy document_types_write on document_types for all to authenticated
  using (is_admin()) with check (is_admin());

-- documents: read follows office + oversight + registry visibility; write
-- requires access to whichever office currently holds the document. The
-- destination office does not need pre-approval to be routed to.
create policy documents_select on documents for select to authenticated using (
  has_read_access(origin_org_unit_id, current_org_unit_id)
);
create policy documents_insert on documents for insert to authenticated with check (
  has_write_access(origin_org_unit_id) and current_org_unit_id = origin_org_unit_id
);
create policy documents_update on documents for update to authenticated
  using (has_write_access(current_org_unit_id))
  with check (true);

-- document_external_meta: mirrors its parent document.
create policy document_external_meta_select on document_external_meta for select to authenticated using (
  exists (
    select 1 from documents d where d.id = document_external_meta.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);
create policy document_external_meta_write on document_external_meta for all to authenticated
  using (
    exists (
      select 1 from documents d where d.id = document_external_meta.document_id
      and has_write_access(d.current_org_unit_id)
    )
  )
  with check (
    exists (
      select 1 from documents d where d.id = document_external_meta.document_id
      and has_write_access(d.current_org_unit_id)
    )
  );

-- document_movements: read follows the parent document; creating a movement
-- requires write access to the sending office (or, for the first entry,
-- to the destination office being originated into).
create policy document_movements_select on document_movements for select to authenticated using (
  exists (
    select 1 from documents d where d.id = document_movements.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);
create policy document_movements_insert on document_movements for insert to authenticated with check (
  case
    when from_org_unit_id is null then has_write_access(to_org_unit_id)
    else has_write_access(from_org_unit_id)
  end
);
create policy document_movements_update on document_movements for update to authenticated
  using (has_write_access(to_org_unit_id))
  with check (has_write_access(to_org_unit_id));

-- document_attachments: mirrors its parent document.
create policy document_attachments_select on document_attachments for select to authenticated using (
  exists (
    select 1 from documents d where d.id = document_attachments.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);
create policy document_attachments_insert on document_attachments for insert to authenticated with check (
  exists (
    select 1 from documents d where d.id = document_attachments.document_id
    and has_write_access(d.current_org_unit_id)
  )
);

-- audit_log: admin-only, and there is deliberately no update/delete policy —
-- see the revoke in 0005_audit_log.sql.
create policy audit_log_select on audit_log for select to authenticated using (is_admin());

-- document_code_counters: not read or written directly by app roles; only
-- next_reference_code() (security definer) touches it. No policies needed
-- beyond RLS being on, which denies all access outside that function.
