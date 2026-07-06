-- Organizational hierarchy: directorate > division > office/unit.
-- Self-referencing so the number of levels isn't hardcoded.
create type org_unit_type as enum ('directorate', 'division', 'office', 'unit');

create table org_units (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references org_units (id) on delete restrict,
  name text not null,
  unit_type org_unit_type not null,
  code text not null unique, -- short code used in document reference numbers, e.g. "FIN", "REG"
  is_registry boolean not null default false, -- marks the office that runs the general registry
  created_at timestamptz not null default now()
);

create index org_units_parent_id_idx on org_units (parent_id);

-- One row per authenticated staff member, keyed to auth.users.
create type staff_role as enum ('staff', 'head', 'registry_officer', 'admin');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  org_unit_id uuid not null references org_units (id) on delete restrict,
  role staff_role not null default 'staff',
  is_active boolean not null default true,
  on_leave boolean not null default false,
  leave_start date,
  leave_end date,
  created_at timestamptz not null default now()
);

create index profiles_org_unit_id_idx on profiles (org_unit_id);

-- head_user_id is added after profiles exists to avoid a circular FK at creation time.
alter table org_units add column head_user_id uuid references profiles (id) on delete set null;

comment on column profiles.on_leave is 'When true the user has read-only access; a delegation record grants another user write access in their place.';
