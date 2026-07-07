-- Row Level Security for every table. Reporting-line aggregates are
-- deliberately NOT implemented as RLS-visible rows (see 0016_reporting.sql) —
-- they're SECURITY DEFINER functions that return counts only, precisely
-- because the spec wants aggregate visibility without granting row access.

alter table profiles enable row level security;
alter table org_units enable row level security;
alter table prefix_decode_table enable row level security;
alter table positions enable row level security;
alter table document_types enable row level security;
alter table documents enable row level security;
alter table movement_events enable row level security;
alter table minutes enable row level security;
alter table delegations enable row level security;
alter table grants enable row level security;
alter table audit_log enable row level security;
alter table document_attachments enable row level security;
alter table document_code_counters enable row level security;

create or replace function oversees_org_unit(p_org_unit_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (
    select 1 from positions p
    where p.profile_id = auth.uid()
      and p.role in ('head', 'office_manager')
      and p.end_date is null
      and exists (select 1 from org_unit_descendants(p.org_unit_id) d where d.id = p_org_unit_id)
  );
$$;

create or replace function oversees_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (
    select 1 from positions target
    where target.profile_id = p_profile_id
      and target.end_date is null
      and oversees_org_unit(target.org_unit_id)
  );
$$;

-- profiles: broad read (needed to attribute positions/minutes/delegations by
-- name across the app); write is self, admin, or oversight chain.
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or oversees_profile(id))
  with check (id = auth.uid() or oversees_profile(id));
create policy profiles_insert on profiles for insert to authenticated with check (is_admin());

-- org_units: broad read (org chart), admin-only write.
create policy org_units_select on org_units for select to authenticated using (true);
create policy org_units_write on org_units for all to authenticated
  using (is_admin()) with check (is_admin());

-- prefix_decode_table: not broadly readable — the decode_unique_code_origin()
-- function (SECURITY DEFINER) is the intended access path for everyone else.
create policy prefix_decode_select on prefix_decode_table for select to authenticated using (is_admin());
create policy prefix_decode_write on prefix_decode_table for all to authenticated
  using (is_admin()) with check (is_admin());

-- positions: broad read (organogram, delegate pickers, minute attribution).
create policy positions_select on positions for select to authenticated using (true);
create policy positions_write on positions for all to authenticated
  using (oversees_org_unit(org_unit_id))
  with check (oversees_org_unit(org_unit_id));

-- document_types: shared reference data.
create policy document_types_select on document_types for select to authenticated using (true);
create policy document_types_write on document_types for all to authenticated
  using (is_admin()) with check (is_admin());

-- documents: read follows the routing chain (+ audit grant, + admin); you
-- may only originate a document as a position you currently, personally hold.
create policy documents_select on documents for select to authenticated using (
  has_document_chain_access(id)
);
create policy documents_insert on documents for insert to authenticated with check (
  is_admin() or exists (
    select 1 from positions p
    where p.id = originating_position_id and p.profile_id = auth.uid() and p.end_date is null
  )
);
create policy documents_update on documents for update to authenticated
  using (has_write_access_digital(id) or has_write_access_physical(id) or is_admin())
  with check (true);

-- movement_events: read-only to the app (see revoke in 0007); trigger-driven
-- writes run as the function owner, so no insert/update policy is needed.
create policy movement_events_select on movement_events for select to authenticated using (
  has_document_chain_access(document_id)
);

-- minutes: the junior/senior originator split lives in has_minute_chain_access.
-- Writing requires personally, currently holding the document's digital
-- custodian position at the moment of writing.
create policy minutes_select on minutes for select to authenticated using (
  has_minute_chain_access(document_id)
);
create policy minutes_insert on minutes for insert to authenticated with check (
  is_admin() or exists (
    select 1 from positions p
    join documents d on d.current_digital_custodian_id = p.id
    where p.id = author_position_id
      and p.profile_id = auth.uid()
      and p.end_date is null
      and d.id = minutes.document_id
  )
);

-- delegations: visible to the two positions' people and whoever oversees the
-- original position's org unit; only that oversight chain may create/end one.
create policy delegations_select on delegations for select to authenticated using (
  is_admin()
  or exists (select 1 from positions p where p.id in (original_position_id, delegate_position_id) and p.profile_id = auth.uid())
  or exists (select 1 from positions p where p.id = original_position_id and oversees_org_unit(p.org_unit_id))
);
create policy delegations_write on delegations for all to authenticated
  using (exists (select 1 from positions p where p.id = original_position_id and oversees_org_unit(p.org_unit_id)))
  with check (exists (select 1 from positions p where p.id = original_position_id and oversees_org_unit(p.org_unit_id)));

-- grants (AuditGrant): visible to the grantee and admins; issuance is
-- admin-only in this build — see the note in README about representing "SG".
create policy grants_select on grants for select to authenticated using (
  is_admin() or grantee_profile_id = auth.uid()
);
create policy grants_write on grants for all to authenticated
  using (is_admin()) with check (is_admin());

-- audit_log: admin-only, and deliberately no update/delete policy (see the
-- revoke in 0011_audit_log.sql) — nothing can edit or delete history.
create policy audit_log_select on audit_log for select to authenticated using (is_admin());

-- document_attachments: mirrors document chain access for both read and write.
create policy document_attachments_select on document_attachments for select to authenticated using (
  has_document_chain_access(document_id)
);
create policy document_attachments_insert on document_attachments for insert to authenticated with check (
  has_document_chain_access(document_id)
);

-- document_code_counters: no policies beyond RLS being enabled — only
-- next_unique_code() (SECURITY DEFINER) ever touches it.
