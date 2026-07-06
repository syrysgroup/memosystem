-- Discussion thread on a document, separate from the formal movement log
-- (movements record routing decisions; comments are informal back-and-forth).
create table document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index document_comments_document_id_idx on document_comments (document_id, created_at);

-- Flags a document to a colleague for visibility/input without transferring
-- custody (custody transfer is a document_movements row instead).
create table document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  shared_by uuid not null references profiles (id),
  shared_with_user_id uuid not null references profiles (id),
  note text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (shared_with_user_id <> shared_by)
);

create index document_shares_document_id_idx on document_shares (document_id);
create index document_shares_shared_with_idx on document_shares (shared_with_user_id, read_at);

alter table document_comments enable row level security;
alter table document_shares enable row level security;

-- Comments: visible/postable by anyone who can read the parent document.
create policy document_comments_select on document_comments for select to authenticated using (
  exists (
    select 1 from documents d where d.id = document_comments.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);
create policy document_comments_insert on document_comments for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from documents d where d.id = document_comments.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);

-- Shares: the sharer and the recipient can see it; only the recipient marks it read.
create policy document_shares_select on document_shares for select to authenticated using (
  is_admin() or auth.uid() in (shared_by, shared_with_user_id)
);
create policy document_shares_insert on document_shares for insert to authenticated with check (
  shared_by = auth.uid()
  and exists (
    select 1 from documents d where d.id = document_shares.document_id
    and has_read_access(d.origin_org_unit_id, d.current_org_unit_id)
  )
);
create policy document_shares_update on document_shares for update to authenticated
  using (shared_with_user_id = auth.uid())
  with check (shared_with_user_id = auth.uid());

create trigger document_comments_audit after insert or update or delete on document_comments
  for each row execute function audit_row_change();
create trigger document_shares_audit after insert or update or delete on document_shares
  for each row execute function audit_row_change();
