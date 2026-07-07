-- A Position is Role + Person + OrgUnit + time range. Delegation and
-- reassignment act on Positions, not directly on people, and a document's
-- custody/authorship references point at specific Positions so history
-- survives reorganisations and staff turnover.
create type position_role as enum ('head', 'office_manager', 'staff');

create table positions (
  id uuid primary key default gen_random_uuid(),
  org_unit_id uuid not null references org_units (id) on delete restrict,
  profile_id uuid not null references profiles (id) on delete restrict,
  role position_role not null,
  -- Free text, not an enum: identifies specific singular executive positions
  -- (e.g. 'sg', 'director_admin_finance', 'head_hr') referenced by
  -- DocumentType.decision_authority_role for Circular-style approval rules
  -- (spec section 9). Independent of `role`, which drives requester_tier.
  -- Admin-only to set — see the trigger in 0015_rls.sql.
  named_role text,
  start_date date not null default current_date,
  end_date date, -- null = currently serving
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index positions_profile_id_idx on positions (profile_id, end_date);
create index positions_org_unit_id_idx on positions (org_unit_id, end_date);
create index positions_current_idx on positions (profile_id) where end_date is null;
