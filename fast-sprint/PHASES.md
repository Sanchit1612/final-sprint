# Build Phases

Rule: finish a phase, commit to GitHub, update PROGRESS.md, then (optionally) zip the project.
Each phase must end with something that runs.

## Phase 0 - Setup (30-60 min)
Create GitHub repo, Next.js + Tailwind project, deploy empty site to Vercel, add Outfit font, theme colours from DESIGN.md.
Done when: black themed "Fast Sprint" page is live on a Vercel URL.

## Phase 1 - Static UI + content (1-2 days)
Landing page, layout/navbar, DSA + CS checklist pages reading from /content JSON. Ticking works in browser state only.
Done when: you can browse and tick topics (no login yet).

## Phase 2 - Auth + saved progress
Supabase auth (Google or magic link), progress table, ticks saved per user, home dashboard with progress rings.
Done when: progress persists after logout/login.

## Phase 3 - Analytics
Analytics page (Recharts): completion by subject, weekly activity, streak, weak topics. Small card on home linking to it.
Done when: graphs reflect real ticked data.

## Phase 4 - Pro content
Development tracker, aptitude MCQs (timed test + score + review), company packs. All gated by a `isPro` flag (set manually in DB for now).
Done when: Pro pages work for a manually upgraded user and are locked for free users.

## Phase 5 - Payments
Razorpay Checkout (UPI first), fixed-term passes (1/3/6 months), webhook verifies payment, sets pro_until date. Pricing page with bundle cards.
Done when: a test-mode payment unlocks Pro and expiry re-locks it.

## Phase 6 - Polish + launch
Terms, privacy, refund policy pages (needed for Razorpay KYC), mobile fixes, SEO basics, post in college groups/Reddit.

## Phase 7+ (after v1)
Resume/ATS tool, interview experiences, international payments, revision reminders.

---
# Prompt template for every phase (paste into any AI)
"I'm building Fast Sprint. Read PRODUCT.md, DESIGN.md and PROGRESS.md (pasted below). I'm a beginner, so give exact commands and complete files, one step at a time. Today's task: Phase X, step Y. Stack: Next.js App Router, Tailwind, Supabase. Don't change anything outside this step."
