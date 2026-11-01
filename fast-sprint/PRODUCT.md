> Historical planning doc. The current requirements are in FAST_SPRINT_PRODUCT_SRS_V2.md.

# Fast Sprint — Placement Prep Platform (Product Spec)

Solo-built, beginner-friendly. Stack: Next.js (App Router) + Tailwind + Supabase (auth + DB) + Razorpay. Host: Vercel free.
All learning content lives in /content as JSON (no AI cost, easy to edit).

## Core promise
One clean place to track your whole placement prep: checklists, analytics, company questions, aptitude practice.

## Tiers
| | Free | Pro |
|---|---|---|
| DSA checklist | yes | yes |
| Core CS checklist (DBMS, OS, CN, OOP) | yes | yes |
| Tracker + analytics page | yes | yes |
| Curated resources | yes | yes |
| Development tracker (Full Stack/ML/AI) | no | yes |
| Aptitude MCQs (timed, scored) | no | yes |
| Company-wise questions packs | no | yes |

## Pricing (v1, will increase if it works)
- Pro: Rs 89 / month (India), $5 / month (international, added later)
- Bundles (fixed-term passes, NO auto-renew, expire by themselves):
  - 1 month: Rs 89 ("less than a coffee")
  - 3 months: Rs 219 ("cheaper than a pizza")
  - 6 months: Rs 399 ("two movie tickets")
- On expiry: user keeps all progress, loses only Pro features. No "lifetime" plan.

## Screens (v1)
1. Landing + pricing (colourful bundle cards)
2. Login / signup (email magic link or Google)
3. Home dashboard: greeting, streak, progress rings, SMALL analytics card -> links to Analytics page
4. DSA checklist (topic -> problems, tick, bookmark, revise-later)
5. Core CS checklist
6. Development tracker (Pro)
7. Aptitude MCQs (Pro): pick topic, timed test, score, review answers
8. Company packs (Pro): company -> questions list
9. Analytics page: completion by subject, weekly activity graph, streak, aptitude score trend, weak topics
10. Pricing/checkout + account

## Analytics (computed from progress data, no AI)
- Completion % per subject and per topic
- Problems solved per day/week (bar/line)
- Streak + best streak
- Aptitude: accuracy per topic, score trend, avg time per question
- Weak topics = lowest completion or accuracy

## After v1 (backlog)
Resume maker / ATS checker, interview experience page, spaced-repetition revision, daily plan generator, international payments, referral codes.

## Do NOT build in v1
Code editor/execution, AI chatbot, own question bank copied from others, mobile app.
