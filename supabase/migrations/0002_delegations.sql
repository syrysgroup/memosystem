-- Leave delegation: while absent_user is on_leave, delegate_user gets write
-- access scoped to absent_user's org unit for the given date range.
create type delegation_status as enum ('active', 'ended', 'revoked');

create table delegations (
  id uuid primary key default gen_random_uuid(),
  absent_user_id uuid not null references profiles (id) on delete cascade,
  delegate_user_id uuid not null references profiles (id) on delete restrict,
  org_unit_id uuid not null references org_units (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  status delegation_status not null default 'active',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (end_date >= start_date),
  check (absent_user_id <> delegate_user_id)
);

create index delegations_absent_user_id_idx on delegations (absent_user_id);
create index delegations_delegate_user_id_idx on delegations (delegate_user_id);
create index delegations_active_lookup_idx on delegations (delegate_user_id, org_unit_id, status);
