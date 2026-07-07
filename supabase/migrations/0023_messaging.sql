-- Staff communication (added as its own explicit decision per spec section 11,
-- which scopes it out of the base system but allows it as a separate call).
-- An implicit channel per org unit (org_unit_id *is* the channel — no
-- separate channels table) plus direct messages between any two staff.
create table messages (
  id uuid primary key default gen_random_uuid(),
  org_unit_id uuid references org_units (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  recipient_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  check (
    (org_unit_id is not null and recipient_id is null)
    or (org_unit_id is null and recipient_id is not null)
  ),
  check (recipient_id is null or recipient_id <> sender_id)
);

create index messages_org_unit_id_idx on messages (org_unit_id, created_at);
create index messages_dm_idx on messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table messages enable row level security;

-- Channel membership follows CURRENT Positions (this system's one deliberate
-- live-query exception already established for reporting lines, per spec
-- section 7.3 — the same rationale applies here): anyone presently holding a
-- position in that org unit, or presently a head/office_manager anywhere
-- above it in the current organogram.
create or replace function is_channel_member(p_org_unit_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (
    select 1 from positions p
    where p.profile_id = auth.uid()
      and p.end_date is null
      and (
        p.org_unit_id = p_org_unit_id
        or (p.role in ('head', 'office_manager') and exists (
          select 1 from org_unit_descendants(p.org_unit_id) d where d.id = p_org_unit_id
        ))
      )
  );
$$;

revoke execute on function is_channel_member(uuid) from public;
grant execute on function is_channel_member(uuid) to authenticated;

create policy messages_select on messages for select to authenticated using (
  is_admin()
  or (recipient_id is not null and auth.uid() in (sender_id, recipient_id))
  or (org_unit_id is not null and is_channel_member(org_unit_id))
);

create policy messages_insert on messages for insert to authenticated with check (
  sender_id = auth.uid()
  and (
    is_admin()
    or (recipient_id is not null and auth.uid() in (sender_id, recipient_id))
    or (org_unit_id is not null and is_channel_member(org_unit_id))
  )
);
