/**
 * Usage:
 *   npm run content:validate                 # check files in content/import, no database needed
 *   npm run content:import                   # validate + write to Supabase (needs SUPABASE_SERVICE_ROLE_KEY)
 *   npm run content:import -- --dir path     # import from another folder
 *
 * Folder layout (see content/README.md):
 *   content/import/{dsa,core,roadmap,quiz,interview,resources}/*.json|*.csv
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { importAll, type RawFile } from "../src/lib/content/import";
import { CONTENT_KINDS, type ContentKind } from "../src/lib/content/schemas";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dirIdx = args.indexOf("--dir");
  const root = dirIdx >= 0 ? args[dirIdx + 1] : "content/import";

  const files: RawFile[] = [];
  for (const kind of CONTENT_KINDS) {
    const dir = join(root, kind);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      const lower = name.toLowerCase();
      if (!lower.endsWith(".json") && !lower.endsWith(".csv")) continue;
      files.push({ name: join(kind, name), kind: kind as ContentKind, format: lower.endsWith(".csv") ? "csv" : "json", text: readFileSync(join(dir, name), "utf8") });
    }
  }
  if (files.length === 0) {
    console.log(`No content files found in ${root}/. Add files under ${CONTENT_KINDS.map((k) => `${k}/`).join(", ")} (see content/README.md).`);
    return;
  }

  let db = null;
  if (!dryRun) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (or use --dry-run)."); process.exit(1); }
    db = createClient(url, key, { auth: { persistSession: false } });
  }

  const report = await importAll(db, files, { dryRun });
  console.log(`\n${dryRun ? "Validated" : "Imported"} ${report.files} file(s).`);
  for (const [k, v] of Object.entries(report.counts)) console.log(`  ${k}: ${v}`);
  if (report.warnings.length) { console.log("\nWarnings:"); report.warnings.forEach((w) => console.log(`  ! ${w}`)); }
  if (report.errors.length) { console.log("\nErrors:"); report.errors.forEach((e) => console.log(`  x ${e}`)); process.exit(1); }
  console.log(dryRun ? "\nAll files are valid." : "\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
