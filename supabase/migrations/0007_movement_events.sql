-- Append-only history, entirely trigger-maintained (see 0014_functions_actions.sql):
-- the app only ever UPDATEs `documents`, never inserts here directly. Current
-- truth lives on `documents`; this is the derived, immutable ledger of how it
-- got there — including a resulting_* snapshot per axis so the timeline reads
-- correctly without replaying every prior row.
create type movement_channel as enum ('digital', 'physical');
create type movement_cause as enum ('normal', 'office_dissolved', 'decision_stamp');
create type delivery_outcome as enum ('delivered', 'failed');

create table movement_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  channel movement_channel not null,
  from_position_id uuid references positions (id), -- null = origination
  to_position_id uuid not null references positions (id),
  occurred_at timestamptz not null default now(),
  cause movement_cause not null default 'normal',
  delivery_outcome delivery_outcome, -- physical channel only
  failure_reason delivery_failure_reason,
  failure_note text,
  resulting_digital_status digital_status,
  resulting_physical_status physical_status,
  resulting_decision_status decision_status,
  recorded_by uuid references profiles (id), -- null only for system-triggered events (cause = office_dissolved)
  check (failure_reason <> 'other' or failure_note is not null)
);

create index movement_events_document_id_idx on movement_events (document_id, occurred_at desc);
create index movement_events_to_position_idx on movement_events (to_position_id);
create index movement_events_from_position_idx on movement_events (from_position_id);

revoke insert, update, delete on movement_events from authenticated;
