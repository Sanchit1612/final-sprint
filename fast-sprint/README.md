# Fast Sprint

Placement-preparation SaaS for engineering students. Phase 1 (this release): authentication, onboarding, dashboard, DSA and Core CS checklists with per-user progress, notes and bookmarks, a simple dated Daily Sprint task list, an application tracker, and Free/Pro plans with server-side entitlements. Payments are not live.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Recharts · Zod · React Hook Form · Lucide.

## Local setup
```bash
npm install
cp .env.example .env.local        # fill in the three Supabase values
```
1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/migrations/0001_v1_schema.sql` (8 tables + RLS + triggers + five structural root rows), then `0002_quota_security.sql` (quota locking/move checks and content-access policies). For an existing V1 database, review its migration state and apply only 0002. Never run files under `supabase/future/`.
3. **Authentication → URL configuration**: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs (add your Vercel URL later). For Google sign-in, enable the Google provider.
4. Put the project URL and anon key in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Put the service-role key in `SUPABASE_SERVICE_ROLE_KEY` (used only by the scripts, never by the app or browser).
5. `npm run dev` and open http://localhost:3000.

Without Supabase env vars the landing and pricing pages work and every other page shows a setup notice.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm test` | Vitest (scheduler, spaced repetition, import, dates) |
| `npm run content:validate` | Validate files in `content/import` (no database) |
| `npm run content:import` | Import them into Supabase (service role) |
| `npm run entitlement:grant -- email 3 "note"` | Grant or extend a Pro pass (service role) |

## Nested review content
`npm run content:validate:nested` validates all prepared manifests without connecting to Supabase. `npm run content:manifest -- <file>` is a dry run. Do not pass `--apply` until the exact manifest hash has been reviewed and publication approved. The nested importer uses a single transaction and preserves existing IDs; locally supply `SUPABASE_DB_URL` and `SUPABASE_DB_CA_FILE` for an approved run. It does not load `.env.local` automatically. Secrets and the CA file stay outside Git. Never apply `supabase/proposals` automatically.

The activity calendar currently reports completion snapshots, not immutable lifetime learning history. See the on-page limitation before interpreting streaks or Pro coverage.

## Loading legacy content
See `content/README.md`. Put DSA and Core CS files under `content/import/dsa` and `content/import/core`, run `content:validate`, then `content:import`. Prepared datasets now live in `content/collections` and are shown in signed-in **read-only review mode** until approved database publication. See `RESOURCE_IMPORT_REPORT.md`; these are not all verified or complete.

## Free vs Pro
Defined in `src/config/plans.ts`. Enforced in the database, not only the UI:
- Free limits (10 applications, 5 sprint tasks per day) are triggers in the migration (`enforce_free_limits`).
- `content_items.is_pro = true` rows are hidden from non-Pro users by RLS (`has_pro()`).
- `user_entitlements` is read-only to users. Only the service role can write it (`grant_pro()` is revoked from every other role).

Pro passes are granted with the script above or `select public.grant_pro('<user uuid>', 3);` in the SQL editor. Proposed prices (₹89 / ₹219 / ₹399 for 1/3/6 months) are display-only until a gateway is added.

## Project layout
```
src/app            routes: landing, auth, onboarding, pricing, (app)/{dashboard,dsa,core,sprint,applications,saved,settings}
src/app/actions.ts server actions (validated with Zod, always scoped to the signed-in user)
src/components     UI (checklist rows, tree view, task list, applications board, charts)
src/lib            supabase clients, session, content tree loader, dates, content importer
src/lib/schedule   DORMANT: deterministic planner (Phase 3). Tested, unused by the UI
src/lib/revision   DORMANT: spaced-repetition intervals (Phase 3). Tested, unused by the UI
supabase/migrations  V1 schema (applied)    supabase/future  full long-term schema (NOT applied)
content/           import docs, templates, the original sample files
```

## Deploying to Vercel
Add the env vars from `.env.example` (omit the service-role key; keep it local). Set `NEXT_PUBLIC_SITE_URL` and add the production `/auth/callback` URL in Supabase.

## Private preparation-pack sources
The GitHub repository is public. Aptitude, behavioural, company and interview source manifests are intentionally ignored so raw paid-pack contents cannot bypass application entitlements via GitHub. They are preserved locally in `backups/prepared-pro-manifests.zip` and the original resource archive, and must be supplied privately for local review or approved database publication. Fresh clones have the code/Free sources; they do not contain those private packs. The app checks Pro on the server before reading premium review data and uses RLS for published data.

Hosted staging verification scripts: `scripts/verify-staging-shape.mjs` is read-only; `scripts/verify-staging-dsa.mjs --with-disposable-fixtures` creates/removes only generated test identities and must run only on approved staging. Supply credentials locally via Node's `--env-file=.env.local`; never commit them.
