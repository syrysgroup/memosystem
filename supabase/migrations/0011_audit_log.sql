-- Immutable audit trail. Only written via the audit_row_change() trigger
-- function (0014_functions_actions.sql) — no direct insert/update/delete
-- grants to app roles.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id),
  acting_as_position_id uuid references positions (id), -- set when a delegate performs the action for an absent original position
  action text not null,
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
