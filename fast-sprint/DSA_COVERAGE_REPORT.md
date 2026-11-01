# DSA coverage and verification report

2026-11-01. Actual datasets; Master200 and NeetCode150 published to staging only after explicit approval. Other collections remain unpublished. Source commit: `neetcode-gh/leetcode@8fed5f7daa6a517e375a0562d876e4a72dfdafb8`. Source metadata and MIT notice are preserved under content/sources/neetcode/. No problem statements or solution code copied.

| Collection | Actual entries | Hierarchy | Difficulty | Link/video status |
|---|---:|---|---|---|
| Master 200 | 200 unique canonical URLs | 23 patterns | 50 Easy / 129 Medium / 21 Hard | 200 publisher-mapped problem/video pairs; all videos returned oEmbed metadata, original problem-page probes all 403/inconclusive |
| NeetCode 150 | 150 records explicitly flagged by publisher | 18 publisher patterns, source order | 28 Easy / 101 Medium / 21 Hard | All source mappings retained separately; video checks included in the 200 distinct checks |
| Uploaded A2Z | All 455 positions | 18 original steps, original titles/order | Only mapped entries have sourced difficulty | 44 exact title matches + 100 explicit alias candidates; 311 URLs absent. Candidate mappings are not approved publication. |

## Selection method
The Master 200 preserves the publisher's broad 150 interview patterns and adds 50 explicitly selected prerequisites/coverage exercises. Prefix sums, sorting, range queries, monotonic stacks, basic pointer operations, tree traversal and additional graph/DP variants fill the identified gaps. The build script lists each added problem's concept/rationale; the Master is grouped/reordered independently by pattern and difficulty, not presented as an official NeetCode 200. Master and NeetCode 150 remain separate collections with independent progress. There are no canonical duplicates within either.

## Pattern counts — Master 200
- Arrays & Hashing: 14
- Two Pointers: 11
- Sliding Window: 9
- Prefix Sum: 5
- Sorting: 3
- Stack: 7
- Monotonic Stack: 5
- Binary Search: 11
- Linked List: 15
- Trees: 19
- Tries: 3
- Heap / Priority Queue: 7
- Backtracking: 10
- Graphs: 10
- Topological Sorting: 3
- Union Find: 4
- Advanced Graphs: 5
- 1-D Dynamic Programming: 14
- 2-D Dynamic Programming: 15
- Greedy: 8
- Intervals: 7
- Math & Geometry: 8
- Bit Manipulation: 7

## Verification limits
The 400 distinct live checks covered 200 LeetCode problem URLs and 200 YouTube URLs. All LeetCode page probes returned 403; this is inconclusive, not a dead-link finding or a verified successful destination. All video oEmbed calls returned metadata: 186 NeetCode and 14 NeetCodeIO author labels. These were paired using the publisher's source file, not guessed video IDs. Metadata retrieval is not a full playback/content audit. Raw check results are in verification/dsa-link-checks.json.

Six NeetCode 150 problem destinations may require LeetCode Premium (encode/decode strings, connected components, graph valid tree, alien dictionary and the two meeting-rooms problems); the local review view labels this. Free access to a Fast Sprint collection does not remove another site's restrictions.

A2Z candidate matches preserve every original row and its cell references. Explicit aliases are stored separately in content/sources/a2z-aliases.json; null URLs remain null. No inferred sub-step hierarchy has replaced the uploaded version. A secondary archive was rejected after inspecting plainly mismatched links (e.g. Frog Jump -> Target Sum, Lower Bound -> Power of Two). Missing learning lessons, ambiguous variants and sub-step mapping remain real gaps.

## UI status
Actual datasets can be browsed in signed-in review mode with search, patterns, difficulty and video links. Progress/notes/bookmarks remain disabled for unimported A2Z review records. Master200 and NeetCode150 now use hosted staging rows and the existing private actions. Completion, bookmark and note persistence through a full browser reload passed on a Master problem; original visible state was restored after testing. Both collections passed two-identity SQL isolation checks. No production deployment or complete milestone acceptance is claimed.
