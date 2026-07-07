-- The organogram is a versioned graph, not a live-editable tree: a
-- reorganisation inserts a new row and closes out the old one (effective_to),
-- it never rewrites history. `stable_key` is the one thing that persists
-- across a unit's renames/moves, so callers can ask "every version of this
-- office" without caring how many times it has been restructured.
create type org_unit_type as enum ('directorate', 'division', 'office');

create table org_units (
  id uuid primary key default gen_random_uuid(),
  stable_key uuid not null default gen_random_uuid(),
  parent_id uuid references org_units (id) on delete restrict,
  unit_type org_unit_type not null,
  name text not null,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  superseded_by_id uuid references org_units (id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create index org_units_parent_id_idx on org_units (parent_id);
create index org_units_stable_key_idx on org_units (stable_key);
create index org_units_current_idx on org_units (id) where effective_to is null;

comment on column org_units.effective_to is 'Null means this is the current version. Movements/Positions keep referencing the row active at the time — history is never repointed to a newer version.';
