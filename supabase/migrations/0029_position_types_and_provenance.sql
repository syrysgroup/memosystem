-- Establishment-planning schema, added in response to a review of
-- 0028_real_ecowas_organogram.sql:
--
-- 1. Provenance: `org_units.source` is the only way a future query can tell
--    "this structure was deliberately designed in-system" apart from "this
--    was seeded from a scanned photo nobody re-verified." Nullable --
--    existing/historical rows genuinely have no known provenance, and
--    fabricating one would be worse than leaving it null.
--
-- 2. Position templates: every named post on a source organogram --
--    whether it carries one grade or a slash-separated range like
--    "P2/P3/P4" -- becomes a position_type row with a grade_band and a
--    slot_count. Actual incumbents get their own `positions` row
--    referencing the template, with exactly one grade chosen from the
--    template's band at assignment time. Multi-slot roles ("13 Committee
--    Clerks", "11 Drivers") are templates with slot_count > 1, never
--    pre-created as N empty Position rows with nobody accountable behind
--    them -- that would clutter every reporting-line query with phantoms.
--    `position_type_id`/`grade` are independent of `role`/`named_role`,
--    which continue to drive permission scoping untouched.

create table position_types (
  id uuid primary key default gen_random_uuid(),
  org_unit_id uuid not null references org_units (id) on delete restrict,
  title text not null,
  grade_band text[] not null default '{}', -- empty = no formal grade code (e.g. an elected/political office)
  slot_count int not null default 1,
  source text,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  check (slot_count >= 1),
  check (effective_to is null or effective_to > effective_from)
);

create index position_types_org_unit_id_idx on position_types (org_unit_id);
create index position_types_current_idx on position_types (id) where effective_to is null;

alter table position_types enable row level security;

create policy position_types_select on position_types for select using (true);
create policy position_types_write on position_types for all using (is_org_admin()) with check (is_org_admin());

-- Base GRANTs are independent of RLS -- a brand new table has none by
-- default, which would silently 403 every request regardless of how
-- permissive the policies above are (the exact bug 0025 had to fix
-- schema-wide). Do not skip this for new tables going forward.
grant select, insert, update, delete on position_types to authenticated;

alter table org_units add column source text;

alter table positions add column position_type_id uuid references position_types (id) on delete set null;
alter table positions add column grade text;

create or replace function enforce_position_grade_in_band()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.position_type_id is not null and new.grade is not null then
    if not exists (
      select 1 from position_types pt
      where pt.id = new.position_type_id and new.grade = any(pt.grade_band)
    ) then
      raise exception 'grade % is not in the grade band for this position_type', new.grade;
    end if;
  end if;
  return new;
end;
$$;

create trigger positions_enforce_grade_in_band
  before insert or update on positions
  for each row execute function enforce_position_grade_in_band();

-- Trigger-only function; Postgres grants EXECUTE to PUBLIC by default on
-- new functions, which would expose it as a callable RPC to anon and
-- authenticated alike (the same self-inflicted gap closed in 0027).
revoke all on function enforce_position_grade_in_band() from public;
revoke all on function enforce_position_grade_in_band() from anon;
revoke all on function enforce_position_grade_in_band() from authenticated;
