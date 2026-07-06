-- Staff communication: an implicit channel per org unit (no separate
-- channels table — org_unit_id *is* the channel), plus direct messages.
-- Exactly one of org_unit_id / recipient_id is set per row.
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

-- Office channel: members are staff in that org unit, or anyone overseeing it
-- (an ancestor org unit's staff — mirrors document oversight). DMs: the two
-- participants only. Admin sees everything.
create policy messages_select on messages for select to authenticated using (
  is_admin()
  or (
    recipient_id is not null
    and auth.uid() in (sender_id, recipient_id)
  )
  or (
    org_unit_id is not null
    and exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = messages.org_unit_id)
  )
);

create policy messages_insert on messages for insert to authenticated with check (
  sender_id = auth.uid()
  and (
    is_admin()
    or (
      recipient_id is not null
      and auth.uid() in (sender_id, recipient_id)
    )
    or (
      org_unit_id is not null
      and exists (select 1 from org_unit_descendants(current_user_org_unit()) d where d.id = messages.org_unit_id)
    )
  )
);
