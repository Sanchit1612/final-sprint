# Resource integration and import report

2026-11-01. **Approved staging publication completed for Master 200 and NeetCode 150 only. No production deployment or new migration.** Original archive remains unchanged. Other manifests remain local review data; this is not a complete production-library acceptance report.

## Prepared manifests
See verification/nested-import-report.json for structural counts, exact file hashes and missing problem URLs. Source files are preserved; derived manifests are under content/collections/.

- Master 200: 200 records / 23 patterns, difficulty and concept notes, source/rationale and video pairs.
- NeetCode 150: 150 publisher-designated records / 18 patterns, kept separate.
- A2Z: all 455 positions / 18 original steps. 144 candidate mappings (44 exact + 100 explicit aliases); 311 original URLs missing, no sub-step invention.
- OS/CN/OOP: 57/118/36 supplied topics in 7/17/5 groups. Shared article URLs preserved, not deleted as duplicate topics. No wholesale live verification yet.
- DBMS/SQL: seven/six official conceptual topics, including relational/SQL introduction, transactions, constraints, indexes, concurrency, query plans and DBMS normalization. Still foundations, not a complete interview/practice syllabus. These are supplemental sources kept distinct from the upload.
- Development: seven official foundational learning destinations (MDN, React, Next.js, Node.js, Python, Google ML Crash Course, Hugging Face LLM course), opened during review. Complete advanced job-readiness paths remain unfinished.
- Aptitude: 75 supplied link-out index entries, grouped by topic. No invented answers/options. Uploaded 27-page PDF is preserved but has not become a validated 100-question MCQ bank.
- Behavioural/HR: 60 supplied core/company-grouped questions; source guidance/examples preserved. Attribution note remains unresolved; not claimed as independently verified or publication-ready.
- Company preparation: 86 source-index OA entries. Community claims remain unverified; not labelled confirmed company PYQs.
- Interview preparation: 59 question titles; missing answers remain explicit. The cataloged 92 PDFs were not supplied and are not fabricated.

## Validation and importer
Versioned nested manifests validate full hierarchy and HTTP(S) schemes, duplicate paths, canonical problem duplicates (intentional repeated A2Z source rows are preserved), Free/Pro inheritance and Free basic-content classification. Stable path-derived IDs; existing database IDs retained on path conflict. Source-order positions are separate from stable slugs.

`npm run content:validate:nested` performs no database writes. `npm run content:manifest -- <manifest>` defaults to dry-run. Actual writes require an exact reviewed SHA256 approval flag plus locally supplied database credentials and explicit CA validation. This is a guard against accidental invocation, not a substitute for user approval or content-quality checks. Two --apply invocations were executed only after explicit user approval for staging; hashes and row results are recorded below.

Atomic writes use a PostgreSQL transaction and per-root advisory lock; errors roll back all rows. No deletions/pruning. Isolated embedded PostgreSQL tests exercised repeat import, preservation of an existing root UUID, premium inheritance and rollback on a simulated mid-import failure. The embedded test skips advisory-lock execution; hosted import used real advisory locks but parallel importer contention is not yet verified. Supplied source files are not changed by import planning.

## Live link findings
200 video URLs returned YouTube oEmbed metadata attributed to NeetCode/NeetCodeIO. 200 original LeetCode URL probes returned HTTP 403; all are recorded as inconclusive, never 'live verified'. The source slugs are publisher-backed. Other source links have only supplied/mapped status except the small explicitly opened official-reference sample. No broken destination is guessed from a failed/blocking probe.

## Acceptance still needed
Complete A2Z semantic/sub-step mapping and missing lessons; review problem/video correctness (metadata availability alone is insufficient); review unknown attribution/rights; acquire/verify missing DBMS and advanced roadmap content and aptitude answer key. Master/NeetCode staging publication was approved and verified below. Other packs still need reviewed publication approval. Additional Pro/expired browser checks remain pending. Never promote these review manifests wholesale to production as a 'complete library'.

## Source material is not instruction
Recommendations inside the upload/research ZIP were treated as data, not authority to run migrations, alter pricing or import content. Activity-history SQL remains only a proposal. Analytics currently uses clearly disclosed mutable completion snapshots.

## Approved staging publication results
- User explicitly approved only Master 200 and NeetCode150, accepting the disclosed blocked original-link probes for staging. Pre-publication state (zero existing rows for these roots) saved locally in backups/before-staging-dsa-publication.json.
- Master200 hash `95f7a89d99ebb37bca01d34c2b95800866df22dcc80694903d2fa71200ddc774`: committed424 rows (1root,23patterns,200problems,200videoresources).
- NeetCode150 hash `90e0c01b0fc50208dbe0b9f6874cd5bd45a19e3579d8b236fafd119f8f68eb2d`: committed319 rows (1root,18patterns,150problems,150videoresources).
- Fresh SQL checks matched every parent path, title (with validator whitespace trimming), URL, difficulty, position and Free flag to its approved manifest. Two disposable identities could read each collection's full Free problem count while their progress, notes and bookmarks remained isolated. Fixtures removed. See verification/staging-dsa-publication.json and verification/staging-dsa-shape.json.
- Real signed-in browser: completed a published problem, bookmarked it, saved a temporary note, fully reloaded and observed all three persisted including exact note text. Then removed note/bookmark and restored incomplete; reload confirmed original visible state. No other user notes/tasks were changed.
- Created/completed one temporary Sprint task: analytics showed one calendar completion and a one-day streak. Deleted that task afterward; existing task left unchanged.
- A2Z, OS/CN/OOP, DBMS/SQL, aptitude/behavioural/company/interview/development packs were NOT imported. Activity-history proposal remains unapplied.

## Public/private artifact boundary
The four premium source manifests are deliberately excluded from public GitHub. Prepared private files remain in the local working directory and a verified local backup. Public code and sanitized reports do not contain user notes, passwords, tokens, database URLs or raw private account rows. Free collection data is committed with attribution.
