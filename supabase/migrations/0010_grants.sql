-- AuditGrant: temporary, investigation-scoped, full unfiltered access across
-- all documents institution-wide for a given historical audit_period.
-- issued_at/expires_at govern how long the GRANT ITSELF is usable (mandatory,
-- capped, no permanent option) — a separate concept from audit_period,
-- which is the historical window of documents being audited.
create type grant_status as enum ('active', 'expired', 'revoked');

create table grants (
  id uuid primary key default gen_random_uuid(),
  grantor_position_id uuid references positions (id), -- the SG's (or acting SG's) position
  grantee_profile_id uuid not null references profiles (id),
  audit_period_start date not null,
  audit_period_end date not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  original_length_days int not null,
  total_extension_days int not null default 0,
  status grant_status not null default 'active',
  reason text,
  issued_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  check (audit_period_end >= audit_period_start),
  check (expires_at > issued_at),
  check (total_extension_days >= 0),
  check (original_length_days + total_extension_days <= 90)
);

create index grants_grantee_idx on grants (grantee_profile_id, status);

comment on table grants is 'Hard cutoff by design: every read re-checks now() against expires_at via RLS, so access ends immediately on expiry with no separate session-teardown logic needed.';
