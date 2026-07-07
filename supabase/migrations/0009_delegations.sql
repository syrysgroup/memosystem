-- All-or-nothing per Position (deliberately not partial by document type —
-- see spec section 8). While active, the delegate's profile gets write
-- access to everything the original position currently holds.
create type delegation_status as enum ('active', 'ended', 'revoked');

create table delegations (
  id uuid primary key default gen_random_uuid(),
  original_position_id uuid not null references positions (id) on delete cascade,
  delegate_position_id uuid not null references positions (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  status delegation_status not null default 'active',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (end_date >= start_date),
  check (original_position_id <> delegate_position_id)
);

create index delegations_original_position_idx on delegations (original_position_id, status);
create index delegations_delegate_position_idx on delegations (delegate_position_id, status);
