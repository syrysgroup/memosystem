# Memo & Document Tracking System

Institutional memo, circular, and correspondence tracking with physical/digital
movement history, a registry module for incoming/outgoing letters, leave
delegation, and an audit log. Next.js (App Router) + Supabase (Postgres, Auth,
Storage).

Pinned to Next.js 15 rather than 16: as of this writing, Next 16's Proxy
(middleware) architecture always runs on the Node.js runtime, which the
OpenNext Cloudflare Workers adapter doesn't support yet
([cloudflare/workers-sdk#13755](https://github.com/cloudflare/workers-sdk/issues/13755)).
Next 15's `middleware.ts` runs on the Edge runtime, which deploys cleanly.
Revisit once that adapter catches up.

## Setup

1. Create a Supabase project and copy its URL/anon key into `.env.local`
   (see `.env.local.example`).
2. Run the SQL files in `supabase/migrations/` against that project, in
   filename order (via the Supabase SQL editor, the `supabase` CLI, or the
   Supabase MCP `apply_migration` tool).
3. Create at least one `org_units` row per real office/directorate/division,
   and mark exactly one as the registry: `update org_units set is_registry =
   true where code = '...'`.
4. Create staff accounts in Supabase Auth, then insert a matching row in
   `profiles` for each (id must match the `auth.users.id`), setting their
   `org_unit_id` and `role` (`staff`, `head`, `registry_officer`, or `admin`).
   The first admin has to be inserted directly — `profiles` insert is
   otherwise admin-only.
5. `npm install && npm run dev`.

## What's here (Phase 1: Foundation + Registry core)

- Org hierarchy (directorate/division/office/unit), staff profiles, roles.
- Documents with auto-generated reference codes (`PREFIX/ORGCODE/YEAR/SEQ`),
  extensible document types (Memo, Circular, Report, Incoming/Outgoing Letter).
- Movement tracking between offices (digital/physical/both), with days-in-
  current-office computed live and a receipt-acknowledgment step for physical
  copies.
- Registry intake for incoming letters (with scan upload) and dispatch
  acknowledgment recording for outgoing correspondence.
- Track-by-reference-code lookup, so registry staff can answer a visitor's
  email without walking to an office.
- Leave → read-only access, with office-head-assigned delegation that grants
  a stand-in write access for a date range.
- Staff directory.
- Full audit log (who did what, before/after) via database triggers,
  independent of the application code.
- Staff communication: an auto-created channel per office/division/
  directorate (membership follows the org hierarchy — a division head is in
  every office channel beneath them) plus direct messages between any two
  staff members.
- Document sharing: flag a document to a colleague for input/visibility
  without transferring custody (that's still a formal routing/movement), plus
  a lightweight discussion thread on each document.

Row Level Security enforces all of the above at the database layer — see
`supabase/migrations/0007_rls_policies.sql` (core) and
`supabase/migrations/0011_messaging.sql` / `0012_document_comments_and_shares.sql`.

## Not yet built

A public (non-staff) self-service tracker — visitors currently go through the
registry by email, per the requirements this phase targeted. Reporting/
analytics dashboards and SLA breach alerting are also not built yet.

## Regenerating types

`src/lib/supabase/types.ts` is hand-written to match the migrations. Once the
project is linked, replace it with `supabase gen types typescript`. Note: use
`type`, not `interface`, for the row shapes — see the comment at the top of
that file for why.
