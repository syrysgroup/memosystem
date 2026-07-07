-- Scans and other files: the letter itself, a dispatch acknowledgment, or a
-- decision-stamp record of where the physically-stamped copy is stored.
create type attachment_kind as enum ('scan', 'acknowledgment', 'decision_stamp', 'other');

create table document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  movement_event_id uuid references movement_events (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  kind attachment_kind not null default 'other',
  uploaded_by uuid not null references profiles (id),
  uploaded_at timestamptz not null default now()
);

create index document_attachments_document_id_idx on document_attachments (document_id);
