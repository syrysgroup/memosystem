-- Each document type owns its routing/approval behaviour rather than having
-- it hardcoded. decision_authority_role is an array so a type like Circular
-- can name multiple independently-empowered approvers (see 0018_seed.sql and
-- the make_decision function for how 'current_custodian' vs named roles like
-- 'sg' are interpreted).
create table document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique, -- the DOC-TYPE segment of unique_code, e.g. "PROC-MEM", "CIRC", "LTR-IN"
  routing_rule jsonb not null default '{}'::jsonb,
  decision_authority_role text[] not null default array['current_custodian'],
  retention_period interval,
  template jsonb, -- e.g. {"en": "...", "fr": "...", "pt": "..."}
  physical_copy_required boolean not null default false,
  is_external_correspondence boolean not null default false, -- registry-originated intake/dispatch types
  is_active boolean not null default true
);
