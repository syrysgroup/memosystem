-- Every hop a document takes, physical and/or digital, tracked separately
-- from receipt so a mismatch (digital arrived, physical still in transit)
-- is visible instead of hidden.
create type movement_mode as enum ('digital', 'physical', 'both');

create table document_movements (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  from_org_unit_id uuid references org_units (id) on delete restrict, -- null for the originating entry
  to_org_unit_id uuid not null references org_units (id) on delete restrict,
  mode movement_mode not null default 'digital',
  sent_by uuid not null references profiles (id),
  sent_at timestamptz not null default now(),
  received_by uuid references profiles (id),
  received_at timestamptz,
  remarks text,
  action_taken text
);

create index document_movements_document_id_idx on document_movements (document_id, sent_at desc);
create index document_movements_to_org_unit_id_idx on document_movements (to_org_unit_id);

create type attachment_kind as enum ('scan', 'acknowledgment', 'original', 'other');

create table document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  kind attachment_kind not null default 'other',
  uploaded_by uuid not null references profiles (id),
  uploaded_at timestamptz not null default now()
);

create index document_attachments_document_id_idx on document_attachments (document_id);
