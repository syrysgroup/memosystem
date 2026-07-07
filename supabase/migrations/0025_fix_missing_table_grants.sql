-- PostgREST requires a base table GRANT in addition to a passing RLS policy
-- — RLS only narrows access that's already been granted; it never grants
-- access on its own. Every table's RLS policy from 0015_rls.sql onward was
-- correct, but the base GRANT to `authenticated` was never actually applied
-- to this project (only REFERENCES/TRIGGER/TRUNCATE ended up granted,
-- confirmed via information_schema.role_table_grants). Every table
-- read/write from the app has been "permission denied" (PostgREST 403)
-- since the schema was first applied, independent of whatever RLS would
-- have allowed — this is the actual root cause behind "login works but the
-- dashboard doesn't show anything".

grant select, insert, update, delete on
  profiles, org_units, prefix_decode_table, positions, document_types,
  documents, minutes, delegations, grants, document_attachments, messages
to authenticated;

grant select on documents_with_status to authenticated;

-- movement_events and audit_log are append-only, trigger-maintained history
-- (see 0007_movement_events.sql / 0011_audit_log.sql) — authenticated may
-- read them (subject to RLS: audit_log is admin-only) but never write
-- directly.
grant select on movement_events, audit_log to authenticated;
