# Fast Sprint: Product Requirements (V2)

Supersedes `PRODUCT.md` where they differ (kept for history; written under the earlier working name).

## Vision
A complete placement-preparation SaaS with Free and Pro plans, delivered in phases. No feature below is cancelled.
Dashboard · DSA · Core CS (DBMS, OS, CN, OOP) · Development roadmaps (Full Stack, ML, AI/LLM) · Aptitude · HR, behavioural and technical interviews · Daily Sprint · Personalised Placement Mode · Revision and spaced repetition · Company-specific preparation · Application tracker · Analytics and readiness reports · Profile and settings · Free and Pro subscriptions.

## Phases
1. **Phase 1 (built)**: auth, onboarding/profile, dashboard, DSA and Core CS checklists, per-user progress, notes, bookmarks, simple Daily Sprint, application tracker, Free/Pro entitlements.
2. **Phase 2**: aptitude, behavioural/HR/technical questions, roadmaps, company collections, quizzes.
3. **Phase 3**: Placement Mode with adaptive scheduling, spaced repetition, company mocks, advanced analytics and readiness reports, payment gateway and full Pro enforcement.
4. **Phase 4**: weekly reports and notifications, interview story bank, referrals, peer percentile and leaderboards, scoped AI-assisted interview features.

## Plans (proposed launch prices, to validate with students)
| Plan | Price |
|---|---|
| Pro, 1 month | ₹89 |
| Pro, 3 months | ₹219 |
| Pro, 6 months | ₹399 |
Fixed-term passes, no auto-renew; progress is kept when a pass ends.

**Free**: DSA and Core CS checklists, basic progress, notes and bookmarks, basic Daily Sprint (5 tasks/day), basic application tracker (10 applications), selected basic practice.
**Pro**: full Placement Mode, advanced Daily Sprint and planning, spaced repetition and revision tools, company mocks, advanced analytics, readiness and gap reports, expanded aptitude and interview prep, premium roadmaps where licensing permits.

## Phase 1 rules
- Checklist items link out to LeetCode, GeeksforGeeks and similar sites. No timers or time tracking on problems.
- Daily Sprint is a dated task list, not an automatic planner.
- Real data only: no fabricated statistics, no invented content or links.

## V1 data model (8 tables)
`profiles` · `content_items` (parent-child tree: subject, topic, section, problem, resource) · `user_item_progress` · `user_notes` · `user_bookmarks` · `daily_tasks` · `applications` · `user_entitlements`.
Analytics are derived from `user_item_progress` and `daily_tasks`. Later additions, only when built: `payment_orders`, quiz, revision-history and scheduling tables (drafts in `supabase/future/`).

## Security
Supabase Auth for identity. RLS on every table using `auth.uid()`. Entitlements are read-only to users; Pro grants run through a service-role-only function. Free limits and Pro-only content are enforced by the database. The service-role key never appears in browser code.

## Design
Dark-first, Outfit font, blue accent, per `DESIGN.md`.

## Approved product direction — 2026-11-01 expansion
The main DSA experience is a separately curated 200-problem pattern collection, with separate uploaded-version A2Z and canonical NeetCode 150 collections. All three plus basic Core CS are Free (authentication required). Complete aptitude, behavioural/HR, company and expanded technical packs are Pro when implemented. SQL remains Free; expanded Development paths are Pro. Basic calendar/analytics are Free; detailed analytics and readiness insights are Pro. These entitlements do not imply that pending collections/features are available today. Prices remain ₹89/₹219/₹399 fixed-term passes. No live checkout claims.
Resource import follows quality review, explicit collection mapping, safe importer preparation, staging verification and approval for significant schema/content-model changes before actual import. Original uploaded sources stay intact. Immutable activity history is proposed separately, awaiting SQL approval; no fabricated historical events. All previously listed long-term features remain in scope.
