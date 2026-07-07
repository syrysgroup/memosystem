-- Three independent status axes (digital, physical, decision). No transition
-- on one blocks or forces a transition on another; decision_status alone
-- governs whether the days_in_system clock is still running, and is_closed
-- is computed only once physical_status has *also* reached its final state
-- after a decision exists.
create type digital_status as enum (
  'drafted', 'in_transit', 'at_office', 'under_review', 'minuted', 'decided', 'reassigned'
);
create type physical_status as enum (
  'not_dispatched', 'in_transit', 'delivered', 'delivery_failed'
);
create type decision_status as enum (
  'open', 'pending_decision', 'approved', 'rejected', 'withdrawn'
);
create type requester_tier as enum ('senior_originator', 'junior_originator');

-- Declared here (rather than in movement_events) because documents.physical_failure_reason
-- needs it too — the document carries the *current* failure reason, movement_events the history.
create type delivery_failure_reason as enum (
  'recipient_absent', 'office_closed', 'recipient_refused', 'wrong_office', 'document_damaged', 'other'
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  unique_code text not null unique, -- immutable once minted: ORIGIN-UNIT-DOC-TYPE-YEAR-SEQUENCE
  document_type_id uuid not null references document_types (id) on delete restrict,
  subject text not null,
  summary text,
  originating_position_id uuid not null references positions (id) on delete restrict,
  requester_tier requester_tier not null, -- computed once at creation from the originating position's role; never user-editable

  digital_status digital_status not null default 'drafted',
  physical_status physical_status not null default 'not_dispatched',
  decision_status decision_status not null default 'open',

  decision_summary text,
  decision_number text,
  decided_at timestamptz, -- set the instant decision_status becomes terminal; freezes days_in_system

  is_closed boolean not null default false,

  physical_failure_reason delivery_failure_reason,
  physical_failure_note text,

  current_digital_custodian_id uuid references positions (id),
  current_physical_custodian_id uuid references positions (id),

  related_document_id uuid references documents (id),
  relation_type text,

  -- Circular supersession (spec section 9): additive, never overwrites the
  -- original decision. decision_status/decision_summary/decision_number stay
  -- exactly as originally decided — "approved, then superseded" — set only
  -- via supersede_circular(), which is SG-only. See 0017_circulars.sql.
  superseded_at timestamptz,
  superseded_reason text,
  superseded_by_position_id uuid references positions (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_unique_code_idx on documents (unique_code);
create index documents_digital_custodian_idx on documents (current_digital_custodian_id);
create index documents_physical_custodian_idx on documents (current_physical_custodian_id);
create index documents_originating_position_idx on documents (originating_position_id);

comment on column documents.related_document_id is 'Purely referential. Does not gate this document''s own decision or closure — see spec section 3.3.';
