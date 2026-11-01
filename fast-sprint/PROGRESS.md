# Progress

Last updated: 2026-11-01 — hosted Milestone 1 acceptance checks

## Acceptance status
Hosted database security/quota checks passed. Full Milestone 1 acceptance remains OPEN pending real email/Google authentication and signed-in browser checks. Milestone 2 has not started. No migrations were rerun or added during this acceptance work.

## Verified results
- 0001 and 0002 were previously applied to hosted staging after approval. Verified eight RLS-enabled tables, twelve policies, ten triggers, six application functions and five subject roots.
- Hosted SQL tests use two temporary auth.users identities, SET LOCAL ROLE authenticated and request.jwt.claim.sub. For all seven private tables, both identities can read their own fixture and cannot read/update/delete the other's rows. Forged-owner inserts are denied on every table. Self-upgrade updates return no rows; grant_pro execution is denied.
- Eight independent PostgreSQL sessions race for one remaining task slot: one accepted, seven quota rejections, total five. Same race for applications: one accepted, seven rejected, total ten. Two separate sessions moving tasks into one remaining day slot: one accepted, one quota rejection.
- Test fixtures removed after execution; no real account records were changed. Sanitized results: verification/hosted-milestone-1-results.json. These are SQL/RLS checks, NOT Supabase-issued JWT or browser-login tests.
- Local suite: seven files, 34 tests passed, including four new server-action regression tests (input rejection, denied authentication, trusted user binding/quota error and timezone validation).
- Final lint and production build passed in an isolated source copy without .env files. Explicit `npm run typecheck` also passed.
- Browser: signed-out /dashboard redirected to /login?next=%2Fdashboard; empty login produced email/password validation errors; recovery/reset pages rendered with labelled fields. Login screenshot inspected at 390x844 and 1440x900. Mobile login document width matched viewport (390px), and Tab moved focus from email to password with a visible focus indicator.

## Blocked or unverified — manual actions
- Google OAuth browser attempt returned HTTP 400: provider is not enabled. Configure Google OAuth credentials in Supabase Authentication -> Sign In / Providers -> Google. No provider settings were changed automatically.
- User is registering a real test account and confirming email. Registration success, inbox delivery, confirmation callback, password recovery delivery/update, login/logout and refresh/reopen session persistence remain UNVERIFIED until observed. Password entry and password changes must be performed by the user in the browser; never send passwords or recovery links in chat.
- Use http://localhost:3000 consistently and configure Supabase Site URL and callback Redirect URLs for that origin. Earlier OAuth provider availability probe used 127.0.0.1; it did not test the configured localhost callback.
- Signed-in app CRUD, authenticated mobile layouts, screen-reader/contrast audit, full keyboard navigation and end-to-end error states remain pending.
- SQL suite does not exhaust every allowed CRUD operation, anonymous access, hosted premium expiry/revocation or PostgREST/JWT behavior. Premium gating currently has embedded PostgreSQL regression coverage only.
- Server-action zero-row mutation outcomes can still return success, and runtime argument validation coverage is not exhaustive. Streak uses current completion timestamps, not immutable activity history.

## Local backups
Before/after migration schema catalogs and downloaded CA certificate remain under ignored backups/. The acceptance ZIP excludes environment files, credentials, dependencies, generated output and Git internals. Only sanitized results are committed. Final commit, push and archive verification are reported in chat after Git succeeds.

## Changes in this checkpoint
- Added `0002_quota_security.sql`: checks inserts and date moves, serializes quota checks with a per-profile row lock, and permits non-quota updates at capacity. No live migration has been applied and no user data was removed.
- Restricted progress, notes and bookmarks to accessible content using restrictive RLS policies. Users retain read-only access to their own entitlement record; trusted grants remain service-role-only.
- Added password recovery/request and password update pages, a login link, and same-origin callback redirect validation.
- Paginated dashboard completion history, tasks, applications and Saved lists; removed the 60-day streak window. These are derived from current completion rows, not an immutable activity history.
- Surfaced previously ignored tree, account, revision-count and list-read errors through error boundaries; made logout failure explicit.
- Added strict calendar/timezone validation, fail-closed entitlement date checks and disabled checklist controls during pending writes.
- Expanded local regression coverage with embedded PostgreSQL migration/RLS/quota tests and application helper tests. Strengthened environment-file ignores.

## Content and later milestones
Actual resources were received and inventoried in RESOURCE_INVENTORY_MILESTONE_3.md; none have been imported and `content/import` remains empty. The importer still needs hierarchical sections, Pro flags, duplicate/transaction hardening and the actual source resources. Payments are not implemented or enabled. No checkout or webhook has been verified. Milestones 2–7 remain pending; do not start Milestone 2 until this checkpoint is delivered.

## Full product vision retained
Dashboard; DSA; DBMS/OS/CN/OOP; Full Stack/ML/AI roadmaps; aptitude; HR/behavioural/technical interviews; Daily Sprint; Placement Mode; adaptive scheduling; spaced repetition; company preparation; advanced analytics/readiness; applications; interview story bank; Free/Pro fixed-term subscriptions. Existing dormant scheduler, revision engine and future schemas remain in place. The authoritative scope is `FAST_SPRINT_PRODUCT_SRS_V2.md`.

## Resource inventory update
Actual resources inspected without import or schema changes. Original archive and contents preserved with hashes in ignored backups/. A2Z contains 455 ordered entries but no URLs/sub-step structure; Core CS contains OS/CN/OOP groups and URLs; DBMS tree remains missing. See the inventory for full counts and link-validation limits. User reports successful email login, while refresh/logout/recovery and Google OAuth still await observed acceptance checks. Milestone order remains unchanged.
