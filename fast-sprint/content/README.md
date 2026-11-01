# Importing your content

Fast Sprint ships with **no educational content**. You bring your own sheets and notes; the importer loads them into the `content_items` tree and keeps your original hierarchy, order and URLs.

```
content/import/
  dsa/*.json | *.csv      DSA topics and problems
  core/*.json | *.csv     DBMS, OS, CN, OOP topics
```

```bash
npm run content:validate     # checks files, reports errors and duplicates. No database needed
npm run content:import      # writes to Supabase (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
```

Re-running an import updates existing rows (matched by path) instead of duplicating them. Files with errors stop the whole import before anything is written.
`aptitude`, `interview`, `roadmap`, `quiz` and `resources` folders are recognised but skipped with a warning until their phase.

## DSA (JSON)
```json
{
  "subject": "dsa",
  "topics": [
    { "id": "arrays", "title": "Arrays",
      "problems": [
        { "id": "two-sum", "title": "Two Sum", "difficulty": "Easy", "link": "https://leetcode.com/problems/two-sum/", "resource": "" }
      ] }
  ]
}
```
Optional on a problem: `platform`, `tags`, `companies`, `resource` (a video/notes URL shown beside the problem). Optional on a topic: `description`, `resources: [{ "title", "url" }]`.
`difficulty` is Easy, Medium or Hard (any case). `id` values become URL slugs, so keep them stable between imports.

## DSA (CSV)
Header: `topic_id,topic_title,problem_id,title,difficulty,url,resource_url,platform,tags,companies` (`tags`/`companies` separated by `;`).

## Core CS (JSON)
```json
{ "subject": "os", "topics": [ { "id": "deadlocks", "title": "Deadlocks", "summary": "optional", "resources": [ { "title": "Notes", "url": "https://…" } ] } ] }
```
`subject` is one of `dbms`, `os`, `cn`, `oop`. CSV header: `subject,topic_id,title,summary`.

## Deeper hierarchies
The database supports subject → topic → section → problem. The V1 importer writes topic → problem. A section level (for sheets with step/sub-step/lecture structure) is the first item in PROGRESS.md for when the real sheet arrives.

## Duplicates
- Same `id` twice in a topic: later one skipped, warning printed.
- Same URL in two topics: kept (sheets repeat problems on purpose) and listed as a warning.
- Re-importing the same file: updates in place.
