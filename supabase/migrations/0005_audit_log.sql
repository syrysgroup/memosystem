-- Immutable audit trail. Rows are written by triggers/functions only (see
-- 0006_functions.sql) — no insert/update/delete grants to app roles here,
-- so the only write path is through log_audit_event(), which always runs.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id),
  acting_as_user_id uuid references profiles (id), -- set when a delegate performs the action for absent_user
  action text not null, -- e.g. 'document.create', 'document.route', 'delegation.assign', 'auth.login'
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity_type, entity_id);
create index audit_log_user_id_idx on audit_log (user_id, created_at desc);
create index audit_log_created_at_idx on audit_log (created_at desc);

revoke insert, update, delete on audit_log from authenticated;
