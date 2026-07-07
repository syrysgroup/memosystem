# ECOWAS Memo & Document Tracking System

Institutional document tracking built to a formal design specification
(`memo_system_spec.docx`): versioned organogram, Position-based custody and
delegation, three independent status axes (digital / physical / decision) per
document, tiered minute visibility, registry-only-for-its-own-intake access,
standing ReportingRole aggregates vs. temporary AuditGrants, and Circular-
specific multi-approver rules. Next.js (App Router) + Supabase (Postgres,
Auth, Storage).

Styled to the ECOWAS Corporate Design Manual (Nov 2020): the badge/subline
lockup, primary/secondary colour palette (`src/app/globals.css`), the
yellow/brown/green letterhead stripe (`src/components/stripe-bar.tsx`), and
Source Sans Pro throughout. See "Branding" below.

Pinned to Next.js 15 rather than 16: as of this writing, Next 16's Proxy
(middleware) architecture always runs on the Node.js runtime, which the
OpenNext Cloudflare Workers adapter doesn't support yet
([cloudflare/workers-sdk#13755](https://github.com/cloudflare/workers-sdk/issues/13755)).
Next 15's `middleware.ts` runs on the Edge runtime, which deploys cleanly.
Revisit once that adapter catches up.

## Setup

1. `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   for your Supabase project (see `.env.local.example`).
2. Run the SQL files in `supabase/migrations/` against that project, in
   filename order.
3. Seed the organogram: insert `org_units` rows (directorate/division/office),
   then `prefix_decode_table` rows mapping each origin office to its
   unique_code prefix (e.g. "FIN" → Finance Directorate) — code minting fails
   without one for the originating office.
4. Create staff accounts in Supabase Auth, insert a matching `profiles` row
   (id = `auth.users.id`), then give each person at least one `positions` row
   (org_unit_id + role: `staff` / `office_manager` / `head`). A person's
   *Position*, not their profile, is what documents are addressed to.
5. To use Circular-specific approval (SG / Director Admin & Finance / Head of
   HR) or audit grants, set `positions.named_role` (`'sg'`,
   `'director_admin_finance'`, `'head_hr'`) on the relevant position — admin
   only.
6. The very first admin has to be inserted directly (`profiles.is_admin`);
   after that, admins can manage everything through the app.
7. `npm install && npm run dev`.

## Branding

Reproduced from the ECOWAS Corporate Design Manual (`ECOWAS_Design_Manual.pdf`,
Nov 2020):

- **Logo**: `src/components/logo.tsx` pairs `public/brand/ecowas-badge.png`
  (the badge, cropped from the manual's own back-cover artwork — colour-
  matched to the documented CMYK/RGB/HEX values) with a real-text subline
  ("ECOWAS PARLIAMENT / PARLEMENT DE LA CEDEAO / PARLAMENTO DA CEDEAO" — this
  deployment is for the ECOWAS Parliament, not the Commission the manual's
  own sample lockup shows), since the manual requires badge and subline
  never be separated. `middleware.ts` explicitly excludes `/brand/*` from
  its auth check — otherwise the logo 404s on the (unauthenticated) login
  page.
- **Colours** (`src/app/globals.css` `@theme`): primary ECOWAS green
  `#008244` / yellow `#e4ca00` / brown `#ad4f2e`, plus the manual's secondary
  palette (light green, orange, deep red, sky blue, ocean blue, blue grey) —
  used for status badges instead of generic Tailwind colours.
- **Typography**: Source Sans Pro (Google Fonts as "Source Sans 3") via
  `next/font/google`, replacing the scaffold's default Geist.
- **Tricolour stripe**: the yellow/brown/green rule from the manual's
  letterheads and publication covers, reused as `<StripeBar />` on the login
  card and the app header.
- The logo may only sit on white or "ECOWAS yellow 12%" per the manual — the
  app's cream page background (`--color-paper`) *is* that 12% tint.
- **Compliance note**: the badge currently shipped is a crop reproduced from
  the design manual, colour-matched pixel-for-pixel. That is a reproduction
  of ECOWAS's registered mark, which is a brand-authorization question, not
  a design decision — do not treat it as cleared for anything beyond a local
  demo until Communications/Legal at the institution signs off on using the
  exact artwork in a live deployment. If you have the institution's actual
  logo file, replace `public/brand/ecowas-badge.png` with it directly (via
  the repo, not a pasted chat image, which this environment can't read back
  as a file) once authorized.

## Internationalization

The app ships in the three official ECOWAS working languages — English,
French, Portuguese:

- Locale is stored in a `locale` cookie, read server-side in
  `src/lib/i18n/get-dictionary.ts` (`getLocale()` / `getDictionary()`, marked
  `import "server-only"`). Server Components fetch the dictionary directly;
  Client Components that need translated strings receive the relevant slice
  as a prop from their nearest Server Component ancestor.
- Switching language is a `setLocale` Server Action
  (`src/lib/i18n/actions.ts`) invoked from `<LanguageSwitcher />`
  (`src/components/language-switcher.tsx`) via `useTransition` +
  `router.refresh()` — it sets the cookie and re-renders in place, no route
  change.
- Dictionaries live in `src/lib/i18n/dictionaries/{en,fr,pt}.ts`, all
  implementing the single `Dictionary` type in `src/lib/i18n/dictionary.ts`.
  Institutional/administrative register throughout (e.g. "Autorisations
  d'audit" / "Autorizações de Auditoria" for Audit Grants), not machine
  translation.
- Only pass narrow, string-only slices of the dictionary to Client
  Components (e.g. `dict.login`, `dict.messages`) — several dictionary
  sections (`badges.days`, `dashboard.scopeHead`, `reports.newlyInheritedNote`,
  `team.institutionWideCount`) hold pluralization/interpolation functions,
  and React will throw at runtime ("Functions cannot be passed directly to
  Client Components") if the whole `Dictionary` crosses the server/client
  boundary. `DaysBadge` and friends in `src/components/badges.tsx` are safe
  because they're only ever rendered from Server Components.

## Demo accounts

A small demo org (`supabase/migrations/0024_demo_seed.sql`) is seeded on the
live project so every role can be logged into without first building an
organogram by hand. Password for all of them: **`EcowasDemo#2026`** (also
shown via "Show demo accounts" on the login page).

| Role | Email | What it demonstrates |
| --- | --- | --- |
| Admin | `demo.admin@ecowas-demo.org` | `is_admin`, audit grant issuance, head of Directorate of Communication |
| Secretary-General | `demo.sg@ecowas-demo.org` | `named_role = 'sg'` — Circular decision authority, supersession |
| Director, Admin & Finance | `demo.finance@ecowas-demo.org` | `named_role = 'director_admin_finance'`, an overdue incoming letter in queue |
| Head of HR | `demo.hr@ecowas-demo.org` | `named_role = 'head_hr'`, a fully decided/closed Memo |
| Office Manager | `demo.commsmanager@ecowas-demo.org` | senior tier, delegate-of-record for the on-leave staff account, Circular origination |
| Staff (on leave) | `demo.staff@ecowas-demo.org` | junior tier, "on leave — read only" banner, active delegation |
| Registry | `demo.registry@ecowas-demo.org` | Incoming Letter intake, origin-code decoding |

These are ordinary rows (`org_units`, `positions`, `profiles`,
`auth.users`/`auth.identities`, a few `documents`) — delete them the same way
you'd remove any other test data if you don't want them on a production
deployment. Seeding auth.users directly requires running as the Postgres
service role (Supabase SQL editor/CLI/MCP), not through the app itself.

## Core model

- **OrgUnit**: versioned, not live-edited — a reorg inserts a new row and
  closes the old one (`effective_to`), so history never gets silently
  repointed.
- **Position**: role + person + org unit + time range. Custody, authorship,
  and delegation all reference Positions, not people directly, so
  reorganisations and staff turnover don't corrupt history.
- **Document**: `unique_code` (immutable, `ORIGIN-DOCTYPE-YEAR-SEQ`),
  `requester_tier` (senior/junior, computed from the originator's role — Head
  and Office Manager are senior), and three independent status axes:
  `digital_status`, `physical_status`, `decision_status`. `is_closed` is
  computed, never set directly.
- **MovementEvent**: append-only, entirely trigger-maintained history of both
  custody tracks — the app only ever `UPDATE`s `documents`.
- **Minute**: read access is permanent for anyone who was ever a real
  participant (movement handler, minute author, or *senior*-tier originator);
  a junior-tier originator gets `decision_summary`/`decision_number` on the
  document but never minute content.
- **Registry**: `org_units.is_registry` flags which offices count as
  Registry. Originating an external-correspondence `document_type`
  (Incoming/Outgoing Letter, `is_external_correspondence`) is rejected at the
  `prepare_new_document()` trigger level for any position outside a
  Registry-flagged unit — not just hidden from the UI. Registry naturally
  has zero visibility into documents it never touched, since access follows
  the routing chain, not the office. A separate, always-available "decode a
  code's origin office" tool (`decode_unique_code_origin()`) queries
  `prefix_decode_table` directly and never joins `documents` — it can only
  ever return an office name, nothing about the document itself.
- **ReportingRole vs. AuditGrant**: reporting-line heads get aggregate,
  bucketed counts only (`reporting_line_summary`) plus a deliberately broader
  drill-down (`reporting_line_drilldown`: subject + offices, still no
  minutes) — never raw row access. AuditGrants are temporary,
  security-admin/SG-issued, full-access, hard-cutoff-on-expiry (every read
  re-checks `now()` against `expires_at`), capped at 90 cumulative days via
  30-day auto-extensions.
- **Circulars**: SG / Director Admin & Finance / Head of HR are each
  independently empowered to decide one (`positions.named_role` +
  `document_types.decision_authority_role`); once decided, no peer can
  override — only the SG can *supersede* (`supersede_circular()`), which is
  additive (the original decision stays visible, marked superseded) and never
  rewrites the decision itself.
- **org_admin vs. security_admin**: `profiles.is_admin` is the bootstrap
  superadmin (bypasses everything, folded into both narrower checks below so
  the first admin is never locked out). Two independent, RLS-enforced claims
  narrow that down for real delegation: `is_org_admin` (org units, positions
  org-wide, document types — minus `decision_authority_role`) and
  `is_security_admin` (audit grant issuance/visibility, audit log,
  `positions.named_role`, `document_types.decision_authority_role`, Circular
  supersession). These are checked in the RLS policies and triggers
  themselves (`is_org_admin()`/`is_security_admin()` SQL functions) — an
  org_admin genuinely cannot issue an audit grant via a direct API call, not
  just via a hidden button (verified live: `set role authenticated` +ing as
  the demo HR account, an `insert into grants` is rejected by RLS; the demo
  SG account, `is_security_admin` only, succeeds).

## Known simplifications vs. the spec

- **Grant expiry mid-session**: hard cutoff, by design (confirmed) — RLS
  re-evaluates on every read, so there's no separate soft-cutoff session state
  to track.
- **Requester tier mapping**: Head + Office Manager → senior; Staff → junior
  (confirmed).
- A public (non-staff) self-service tracker isn't built; visitors go through
  Registry's "look up a document" tool, which is access-gated like any other
  document read.

## Staff communication

The spec (section 11) scopes a general chat platform out of the base system,
but explicitly allows it "as its own system decision" — added on request. An
implicit channel per org unit (membership = anyone currently holding a
Position there, plus any current head/office_manager over it in the live
organogram — the same live-query exception already used for reporting
lines) plus direct messages between any two staff. Independent of the
Document/Minute/Position model; nothing here affects document access rules.

## Verification status

The schema (19 migrations + 3 follow-up hardening fixes) was verified against
a local throwaway Postgres — every access rule (chain-based document/minute
visibility, registry-gets-nothing-outside-its-own-chain, delegate read+write,
active-vs-expired audit grants, Circular multi-approver + supersession,
reporting-line aggregation) was exercised as the actual `authenticated`
Postgres role, not superuser, then applied to the live Supabase project. The
Next.js app builds/typechecks/lints clean.

That local verification had a real gap, though: it never caught that the
live project was missing the base table `GRANT`s (`SELECT`/`INSERT`/
`UPDATE`/`DELETE`) to `authenticated` on every single table — RLS policies
narrow access that's already granted, they don't grant it themselves, and
apparently my local test setup had implicit grants that never made it into
a versioned migration. The live project had *only*
`REFERENCES`/`TRIGGER`/`TRUNCATE` for `authenticated` on every table
(confirmed via `information_schema.role_table_grants`), so every table
read/write 403'd from the moment the schema went live — sign-in itself
"succeeded" (auth isn't gated by these grants) but nothing past it ever
worked. Fixed in `0025_fix_missing_table_grants.sql`, and confirmed live via
`set role authenticated; select count(*) from profiles;`. Lesson: verifying
RLS logic in isolation isn't the same as verifying the live project can
actually serve a request — check `information_schema.role_table_grants`
against a deployed project too, not just RLS policy behavior locally.

I still can't run a live authenticated *browser* walkthrough from this
environment — outbound HTTPS to the Supabase project host isn't in this
sandbox's network allowlist (only the Supabase MCP channel is) — so please
do one end-to-end pass from your own machine or a deploy preview once this
lands.

## Regenerating types

`src/lib/supabase/types.ts` is hand-written to match the migrations. Note:
row shapes use `type`, not `interface` — interfaces don't satisfy the
`Record<string, unknown>` constraint `@supabase/supabase-js`'s generic schema
checking needs, since they're open for declaration merging and closed type
aliases aren't. See the comment at the top of that file.
