# Assessment storage — approved staging application

Exact SQL: supabase/proposals/assessments.sql
SHA256: 12240c87ae597f3ac7424e0fae7c60683c49244d7744dc7b96358cf5bfe271c7

Adds two tables, two service-only functions and one timestamp trigger. Existing tables, content, entitlements and users remain intact.

quiz_attempts stores immutable question/answer snapshots, submitted choices and score. Its table is RLS-enabled with no authenticated/anonymous access, because snapshots contain answer keys. Server actions bind the verified session user; service-role RPCs reserve/grade attempts. start_quiz serialises per user using the existing profile row lock, allows one Free start per UTC day, and exempts active Pro users. UTC avoids bypassing limits by changing profile timezone. Retry IDs are idempotent. Starting consumes the daily attempt; an unfinished attempt can be resumed. submit_quiz locks the attempt, grades against the stored key and returns the original result for repeat submissions. No client-supplied score is accepted.

study_progress allows only authenticated users' own rows for Free SQL/LLD checklists. App actions validate keys against the published original study items. No original Core CS manifests are imported by this proposal.

Local PGlite tests pass: Free daily limit, retries, replay-safe grading, cross-account submit denial, client answer-table/RPC denial, unlimited Pro starts, and study-row ownership. Hosted separate-session concurrency and browser acceptance are required after approval. ASSESSMENTS_ENABLED defaults false until setup is verified.

Proposed scope: existing staging project only, schema catalog backup first, exact file once, disposable two-account and separate-session quota tests. No production deployment, live payments, content import, activity-history SQL or other migrations.

User approved this exact hash on 2026-11-03. Schema catalog preserved in ignored backups/staging-before-assessments.json; applied once on staging only. Verified both tables, the own-user policy and timestamp trigger, with trusted function permissions tested. Hosted tests passed with two disposable identities and eight independent concurrent sessions (one Free admission). Browser Free/Pro acceptance and cleanup are recorded in verification/browser-assessments-acceptance.json. ASSESSMENTS_ENABLED=true locally after acceptance; keep false on any unreviewed deployment environment. Production remains unchanged.
