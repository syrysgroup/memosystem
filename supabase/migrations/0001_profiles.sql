-- Person identity, linked to Supabase auth. Organizational role/office is
-- NOT stored here — that lives on `positions`, which is time-scoped and
-- historical. `is_admin` is a system-level flag orthogonal to the organogram
-- (org management, user onboarding), not an organogram rank.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  on_leave boolean not null default false,
  leave_start date,
  leave_end date,
  created_at timestamptz not null default now()
);

comment on column profiles.on_leave is 'While true, this person''s current positions are read-only; a Delegation grants someone else write access in their place.';
