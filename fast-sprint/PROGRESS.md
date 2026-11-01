# Progress

Last updated: 2026-11-01 — Milestone 1 checkpoint

## Status
Milestone 1 checkpoint prepared; full Milestone 1 acceptance remains pending the hosted and multi-session checks below. Milestone 2 has NOT started. The existing architecture, eight-table foundation, design and complete V2 roadmap are preserved. This is the first Git checkpoint of the existing project because the local repository had no commits and remote main was absent when checked.

## Changes in this checkpoint
- Added `0002_quota_security.sql`: checks inserts and date moves, serializes quota checks with a per-profile row lock, and permits non-quota updates at capacity. No live migration has been applied and no user data was removed.
- Restricted progress, notes and bookmarks to accessible content using restrictive RLS policies. Users retain read-only access to their own entitlement record; trusted grants remain service-role-only.
- Added password recovery/request and password update pages, a login link, and same-origin callback redirect validation.
- Paginated dashboard completion history, tasks, applications and Saved lists; removed the 60-day streak window. These are derived from current completion rows, not an immutable activity history.
- Surfaced previously ignored tree, account, revision-count and list-read errors through error boundaries; made logout failure explicit.
- Added strict calendar/timezone validation, fail-closed entitlement date checks and disabled checklist controls during pending writes.
- Expanded local regression coverage with embedded PostgreSQL migration/RLS/quota tests and application helper tests. Strengthened environment-file ignores.

## Final checks actually executed
- `npm test`: 6 files, 30 tests passed.
- `npm run lint`: passed without warnings.
- `npm run build`: passed, Next.js 15.5.28, including type validation.
- `npm run typecheck`: passed without errors.
- Embedded PostgreSQL executed BOTH active migrations using a minimal Supabase identity contract. Verified task insertion/move limits, completion at capacity, application limits/status updates, private-task isolation, denied entitlement inserts/updates and denied grant RPC, premium visibility and denied premium progress writes before a trusted grant.
- The embedded database has one serialized connection: it does NOT prove cross-session concurrency safety, nor does it replace real Supabase Auth/PostgREST tests.
- Earlier no-environment production HTTP smoke checks confirmed landing/pricing and setup notices. Browser interactions and responsive layouts were not verified in this checkpoint.

## Pending verification — requires external setup
1. Supply a staging Supabase project via local `.env.local` (never chat or Git): `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Service-role credentials are only required locally for administrative scripts, not for the frontend or deployment.
2. Review and apply `0001_v1_schema.sql`, then `0002_quota_security.sql` on a fresh project. On an existing V1 database apply only 0002 after checking migration state. Do NOT apply `supabase/future`. The second migration replaces quota triggers and adds restrictive policies; it does not delete data.
3. Test at least two independent authenticated accounts through Supabase: cross-user reads AND writes on every private table, anonymous denial, entitlement tampering, premium content, expiry and revoked access.
4. Run concurrent inserts/moves from separate PostgreSQL sessions near both limits. The lock implementation is present, but this runtime scenario remains unverified.
5. Verify registration, email confirmation, email recovery links, password changes, Google OAuth, logout, session persistence, protected routes, invalid/expired links and every Phase 1 CRUD flow in a browser. Configure Supabase Site URL and callback allowlist first.
6. Browser accessibility/mobile checks and error states remain pending. Remaining Milestone 1 review includes mutation zero-row outcomes and complete server-action/security regression coverage; current tests are not exhaustive.

## Backup and Git
The checkpoint ZIP is generated from the reviewed source set, excluding dependencies, generated output, Git internals and secrets. It is checked for CRC errors, file-set equality and matching source bytes before handoff. The final chat report records the successful commit/push hash and backup path; do not interpret this section as confirmation of a push before Git reports success.

## Content and later milestones
No real educational content has been imported; `content/import` is empty. The importer still needs hierarchical sections, Pro flags, duplicate/transaction hardening and the actual source resources. Payments are not implemented or enabled. No checkout or webhook has been verified. Milestones 2–7 remain pending; do not start Milestone 2 until this checkpoint is delivered.

## Full product vision retained
Dashboard; DSA; DBMS/OS/CN/OOP; Full Stack/ML/AI roadmaps; aptitude; HR/behavioural/technical interviews; Daily Sprint; Placement Mode; adaptive scheduling; spaced repetition; company preparation; advanced analytics/readiness; applications; interview story bank; Free/Pro fixed-term subscriptions. Existing dormant scheduler, revision engine and future schemas remain in place. The authoritative scope is `FAST_SPRINT_PRODUCT_SRS_V2.md`.
