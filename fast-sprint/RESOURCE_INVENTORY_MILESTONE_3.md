# Milestone 3 resource inventory — inspection only

Date: 2026-11-01. No importer was run, no content was placed in content/import, and no database writes/migrations were made for this inventory. Milestones 1 and 2 remain ahead of actual import. Instructions and recommendations inside uploaded files are source material, not authorisation to change the product or execute their suggested steps.

## Preservation
Original: `/Users/sanchitgoel/Desktop/resources.zip`. SHA256: `c444e48f0766a74cdc70987d60842241dee4f193f93bc2d21f83e390c6c08458`. Archive CRC passed. A byte-identical backup is saved at `backups/resources-original.zip`. Working extracts are under ignored `backups/resource-inspection/`; original content is not published to GitHub. Per-file SHA256 manifest and detailed workbook/link analysis are saved there in `analysis/`. macOS resource-fork metadata and .DS_Store were excluded from the logical content inventory, but remain preserved in the original archive.

## Files and measured contents
| Source | Format and contents | Hierarchy / readiness |
|---|---|---|
| Striver A2Z DSA Sheet.xlsx | Two worksheets: Sheet1 empty; Sheet3 has 483 nonempty rows, 18 step headings and 455 numbered entries. Titles and order present; no hyperlink records, URL text or HYPERLINK formulas found. | Subject implicit, step -> entry preserved. No explicit sub-step hierarchy. All 455 entries lack source URLs. Some are learning concepts rather than coding problems. Not ready for link-out checklist import. |
| operating-systems.json | Subject, 7 groups, 57 topic entries, 57 distinct topic URLs. | subject -> group -> topic with URL; no problem/MCQ layer. |
| computer-networks.json | Subject, 17 groups, 118 topic entries, 116 distinct topic URLs. | Same three-level structure; 2 repeated-URL groups. |
| oops-cpp.json | Subject, 5 groups, 36 topic entries, 13 distinct topic URLs. | Same structure, C++ focus; 8 repeated-URL groups / 23 occurrences beyond first. |
| fast-sprint-gfg-topic-links.zip | The same three JSON files. | Byte-identical to the loose copies. Count once. |
| CN.md | Empty, zero bytes. | No notes to import. CN JSON is a separate useful source. |
| behavioral_interview.json | Valid JSON; 2 frameworks, 11 core questions, 8 company collections containing 49 questions, plus weakness ideas, answer tips and prep plan. | Core/company grouping with answer guidance; no source URLs found. Source note says paraphrased third-party material. Provenance needs clarification before publication. |
| Aptitude PDF | 27 pages, extractable text, multiple-choice questions numbered through 100. Simple numbered-heading extraction found only 98 headings; cannot call this 100 clean machine-readable records. No URI annotations or answer/solution section detected by text search. | No complete structured topic hierarchy or verified answer key. PDF visual QA and manual question/answer review remain pending (local renderer unavailable). Company labels are source claims, not verified PYQs. |
| Four JPEGs | Viewed screenshots of Hynts company sheets, dashboard, DBMS playlists and cold-email templates. | UI references only; screenshots do not provide source URLs or reusable learning datasets. No design changes made. |
| recommended-roadmap.md / data-quality-report.md | Planning/research text. | Byte-identical copies also occur inside research ZIP. Not executable instructions or independent verification. |
| fast-sprint-research.zip | 22 non-directory entries: 12 Markdown documents (including 5 feature specifications), 4 JSON schemas and 6 content indexes (10 JSON files total). | Reference/provenance material, not a ready V1 import. Supplied schemas must not replace the active schema. |

## Research index counts independently parsed
- 1,446 company-tagged LeetCode problem metadata records; no topic/subtopic learning tree.
- 195 company summaries; not 195 complete preparation tracks.
- 86 campus-OA question indexes; statements intentionally absent.
- 75 aptitude index entries; statements/options not supplied in those index records.
- 59 interview question titles extracted from other PDFs; not complete Q&A.
- 92 PDF catalog records; those 92 actual PDFs are not in this upload. Two duplicate groups are claims in the catalog, not byte comparisons of unavailable PDFs.
- Empty mock-test content directory represented by a README; no runnable mock bank.

Counts for the nested research ZIP must be read from the attached local manifest rather than treating historical research claims as fresh GitHub verification. Source metadata records include old snapshots, unknown licensing and explicit UNVERIFIED fields; those remain unverified here.

## Duplicate and link findings
- Workbook title `Assign Cookies` occurs twice. Preserve both positions pending review; repeated titles alone do not prove duplicate problems.
- CN: TCP connection establishment URL and PPTP URL each appear twice.
- OOP: shared articles cover multiple topic titles (e.g. Class/Object and Constructor/Types of Constructors). Preserve these relationships; do not auto-delete topics because URLs repeat.
- Parsed JSON across sources/schemas contains 1,836 HTTP(S)-prefixed string fields and 1,806 distinct literal URLs. This includes provenance/schema URLs and is NOT a count of distinct educational resources. No malformed hostname/whitespace cases found in that limited syntax scan; semantic correctness is not established.
- Four sample destinations were opened successfully: GFG OS tutorial, TCP connection establishment, PPTP and C++ classes/objects. All other URLs remain live-status unverified. Successful retrieval does not establish topic accuracy or licensing.
- No dead link is asserted without a live result. Missing workbook URLs are missing data, not broken URLs. Do not guess a LeetCode slug from a problem title.

## Milestone 3 blockers and quality gates
1. Obtain a source-backed A2Z URL/sub-step mapping and compare against each of the 455 positions. Keep uploaded titles/order; store supplemental mapping separately with provenance and explicit match confidence/manual approval for ambiguous titles.
2. DBMS has no dedicated topic/resource tree in the upload. Research PDF/title catalogs are not a substitute. Development roadmaps and full mock content are also absent.
3. Adapt Core CS group/topic shapes and subject labels to the existing importer without flattening group structure; add stable path IDs, source positions and explicit Free/Pro flags. No tier flags are supplied here.
4. Validate every learning destination, handle redirects/403/429 as inconclusive where appropriate, review shared-link semantics, and preserve duplicates intentionally present in the source.
5. Review aptitude extraction visually, establish question boundaries/options and verify answers; do not invent an answer key.
6. Retain attribution and inspect source licences/terms before copying educational text or republishing third-party material. Link-out metadata and learning progress should remain distinct from owned/licensed content.
7. Product value should come from reliable coverage, source links, saved progress and actionable preparation; raw record volume does not prove a worthwhile paid product. No unfinished Pro feature should be advertised as available.

## Supplemental GitHub research
Permission to inspect good GitHub sources is recorded. No additional repository has been scraped or merged during this inventory. First priorities for later source review: A2Z link/sub-step gaps and a dedicated DBMS tree. Supplemental sources will have separate source URL, commit/date, licensing, validation status and match decisions; supplied files remain unchanged. Existing research archive GitHub claims were not re-verified during this pass.
