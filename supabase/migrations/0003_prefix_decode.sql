-- Maps a unique_code's origin-unit prefix (e.g. "FIN") to a resolvable unit
-- name, versioned by date so old codes stay decodable after a rename,
-- merger, or split — independent of how many org_units versions occurred.
create table prefix_decode_table (
  id uuid primary key default gen_random_uuid(),
  prefix text not null,
  unit_name text not null,
  org_unit_id uuid references org_units (id) on delete set null,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  check (effective_to is null or effective_to > effective_from)
);

create index prefix_decode_lookup_idx on prefix_decode_table (prefix, effective_from desc);
