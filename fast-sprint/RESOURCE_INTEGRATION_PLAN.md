# Resource integration proposal — review before import

2026-11-01. This proposal implements the latest user direction without treating uploaded planning text as instructions. No remote schema or content changes have been made in this development checkpoint.

## Collection structure
- `/dsa` defaults to `dsa-200`: 200 distinct, curated problems grouped by primary pattern. A200record dataset is now published to staging only after approval; production acceptance remains pending. Use source-backed IDs/URLs, write original short concept notes, record difficulty provenance and selection rationale. Coverage report must count records actually validated, not target numbers.
- `/dsa?collection=striver` -> `dsa-a2z`: retain the uploaded 18 steps and all 455 original positions/names. Store supplemental URLs/sub-step mapping separately; unresolved entries stay flagged. Live source revisions must not silently replace the uploaded version.
- `/dsa?collection=neetcode` -> `dsa-neetcode150`: independently sourced and validated. Do not call a generic 150-record dataset NeetCode 150.
- Existing `dsa` root remains available at `collection=legacy`; no IDs/progress moved or deleted.
- All three requested collections and basic Core CS content are Free after sign-in. Aptitude, HR/behavioural/company and expanded technical packs are Pro when implemented. Unfinished packs are marked coming soon on pricing.

## Current source readiness
- OS/CN/OOP: complete supplied group/topic shapes, not fully live-link-verified; adapt into subject/group/topic/resources preserving order. Shared URLs are intentional until reviewed. These are link-out records, not copied GFG articles.
- A2Z:455 entries/18steps preserved;144candidate mappings prepared (44exact,100alias),311URLs unresolved. No explicit source substeps; not publication-ready.
- NeetCode150/Master200: sourced from pinned publisher metadata,350independent records with200distinct video mappings checked using oEmbed; all original LeetCode page probes returned403. Only these two collections were approved and published to staging.
- DBMS/SQL/development: supplemental official conceptual foundations prepared as separate manifests; still not a complete interview syllabus or advanced job-readiness path.
- Aptitude: PDF extraction/answers need manual verification; no invented key. Behavioural source attribution/rights unresolved. Company metadata includes source claims, not confirmed company PYQs.

Primary references identified for source review: https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet and https://neetcode.io/roadmap . Their existence does not verify individual problem/video mappings. No video URL has been fabricated or silently substituted with a channel page.

## Existing schema fit
`content_items` already supports arbitrary tree depth, external resources, difficulty, order, tags and JSON metadata. Separate subject roots can represent independent collections without a destructive redesign. Keep progress/notes/bookmarks keyed by existing item UUIDs. New collections have independent completion records; cross-collection progress deduplication is not introduced silently.

Recommended metadata contract: source URL + source record ID/version + imported hash; pattern/topic; original source position/title; source licensing/attribution; link verification result/date/final URL; resource kind + educator; explicit collection tier. Preserve missing video values as null with a missing status. Importer must reject non-HTTP(S) destinations, cycles, ambiguous paths, duplicate canonical records and invalid parent references; propagate premium classification to every descendant rather than relying on parent-only RLS.

The legacy importer remains flat and should not be used for these manifests. A separate nested planner/validator and transactional PostgreSQL importer now supports groups, sections, resources, provenance and inherited tiers without a new RPC/migration. It validates before writes, requires an approved file hash, locks per collection, preserves existingIDs and rolls back on failure. Only two explicitly approved staging imports were run. Existing paths must update in place; removed items require review rather than automatic deletion.

## Analytics decision requiring approval
Current completion rows are mutable: unchecking/rechecking or deleting a task changes prior derived activity. They cannot support an honest immutable activity history or lifetime longest streak.

Proposed additive migration (NOT applied): a small `learning_activity` table with owner, item/task reference, event kind and server timestamp. Database triggers record meaningful completion transitions; authenticated clients can read only their own rows, cannot fabricate or edit history. No login events count as learning. Define daily active status in the user's timezone; current streak tolerates an inactive today until yesterday, longest streak uses all recorded active dates. Existing completions may be explicitly labelled as reconstructed baseline; do not invent past events. No background pipeline required.

This is a new security/data-model decision: obtain approval before applying any migration. In the interim, only label derived completion snapshots as snapshots, not durable learning history. Detailed analytics must be checked on the server and never sent to Free browsers then merely hidden by CSS. Readiness can describe checklist coverage; do not call it predicted interview success or show accuracy/speed without attempt/timing data.

## Acceptance gates
No production import until the final manifests, measured coverage, unresolved URL list, source attribution, tier assignments and proposed SQL have been reviewed. Staging import must pass rollback/idempotency, two-account isolation, Free/Pro/expired access, tree/resource rendering, filters, external links, notes/bookmarks and completion persistence. No checkout claims until a separate gateway task is implemented and tested.

## Current implementation status
Actual Master200 and separate NeetCode150 source datasets are prepared and published to staging with user approval; counts/hierarchy/tier and two-identity isolation checks passed. Actual browser completion/bookmark/note persistence through reload passed; test state restored. A2Z455/18steps and other source manifests remain review-only. 13manifests cover all requested categories with explicit gaps; most are not complete preparation packs.

Monthly interactive calendar and Free basic analytics use real saved completion snapshots. Pro details include group coverage and week/month trends, gated on the server. Immutable history remains unapplied and current snapshot limitations are visible. No predicted interview success, accuracy or speed is invented.

See RESOURCE_IMPORT_REPORT.md, DSA_COVERAGE_REPORT.md and verification/ for source checks, exact staging counts, incomplete mappings and actual test evidence. This is not complete production acceptance of all requested deliverables.
