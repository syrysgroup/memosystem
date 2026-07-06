-- Document types are data, not code, so the institution can add new kinds
-- (circular, report, ...) without a schema change.
create table document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. "Memo", "Circular", "Incoming Letter", "Outgoing Letter"
  code_prefix text not null unique, -- used in reference codes, e.g. "MEMO", "CIRC", "LTR"
  is_external_correspondence boolean not null default false, -- true for registry-tracked incoming/outgoing letters
  is_active boolean not null default true
);

create type document_status as enum (
  'draft', 'pending', 'under_review', 'approved', 'rejected', 'dispatched', 'closed'
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  document_type_id uuid not null references document_types (id) on delete restrict,
  title text not null,
  summary text,
  origin_org_unit_id uuid not null references org_units (id) on delete restrict,
  current_org_unit_id uuid not null references org_units (id) on delete restrict,
  current_custodian_id uuid references profiles (id) on delete set null,
  status document_status not null default 'pending',
  has_physical_copy boolean not null default false,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_current_org_unit_id_idx on documents (current_org_unit_id);
create index documents_origin_org_unit_id_idx on documents (origin_org_unit_id);
create index documents_reference_code_idx on documents (reference_code);
create index documents_document_type_id_idx on documents (document_type_id);

-- Per-document detail specific to registry-handled external correspondence
-- (incoming letters logged by the registry, outgoing letters sent for dispatch).
create type correspondence_channel as enum ('physical', 'email', 'fax', 'courier');
create type correspondence_direction as enum ('incoming', 'outgoing');

create table document_external_meta (
  document_id uuid primary key references documents (id) on delete cascade,
  direction correspondence_direction not null,
  channel correspondence_channel not null,
  correspondent_name text,
  correspondent_organization text,
  contact_email text,
  contact_phone text,
  external_reference_no text,
  dispatch_ack_received boolean not null default false,
  dispatch_ack_scan_path text,
  dispatch_ack_received_at timestamptz
);
