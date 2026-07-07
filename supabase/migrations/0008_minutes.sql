-- Substantive commentary on a document. Read access is permanent for anyone
-- who has ever been a node in the routing chain (see has_minute_access in
-- 0013_functions_access.sql); write is restricted to whoever currently holds
-- digital custody at the moment of writing.
create table minutes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  author_position_id uuid not null references positions (id),
  content text not null,
  created_at timestamptz not null default now()
);

create index minutes_document_id_idx on minutes (document_id, created_at);
