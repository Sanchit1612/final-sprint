import type { SupabaseClient } from "@supabase/supabase-js";
import { csvToObjects } from "./csvConvert";
import { hostName, slugify, urlKey } from "./normalize";
import { schemaByKind, type ContentKind, type CoreFile, type DsaFile } from "./schemas";

/** V1 imports only the checklist content kinds. Others stay valid-but-skipped until their phase. */
export const V1_KINDS: ContentKind[] = ["dsa", "core"];

export interface RawFile { name: string; kind: ContentKind; format: "json" | "csv"; text: string }
export interface Report { files: number; counts: Record<string, number>; warnings: string[]; errors: string[] }
type Parsed = { name: string; kind: ContentKind; data: unknown };

const bump = (r: Report, k: string, n = 1) => { r.counts[k] = (r.counts[k] ?? 0) + n; };

export function parseFiles(files: RawFile[], report: Report): Parsed[] {
  const out: Parsed[] = [];
  for (const f of files) {
    report.files++;
    if (!V1_KINDS.includes(f.kind)) { report.warnings.push(`${f.name}: "${f.kind}" content is a later phase; skipped.`); continue; }
    let objs: unknown[];
    try { objs = f.format === "csv" ? csvToObjects(f.kind, f.text) : [JSON.parse(f.text)]; }
    catch (e) { report.errors.push(`${f.name}: could not parse (${(e as Error).message})`); continue; }
    objs.forEach((o, i) => {
      const res = schemaByKind[f.kind].safeParse(o);
      if (!res.success) for (const issue of res.error.issues.slice(0, 8))
        report.errors.push(`${f.name}${objs.length > 1 ? ` [#${i + 1}]` : ""}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
      else out.push({ name: f.name, kind: f.kind, data: res.data });
    });
  }
  return out;
}

export function checkDuplicates(items: Parsed[], report: Report) {
  const seenUrls = new Map<string, string>();
  for (const { name, kind, data } of items) {
    if (kind !== "dsa") continue;
    const topicIds = new Set<string>();
    for (const t of (data as DsaFile).topics) {
      if (topicIds.has(t.id)) report.warnings.push(`${name}: topic id "${t.id}" appears twice (later entries merge into the first).`);
      topicIds.add(t.id);
      const ids = new Set<string>();
      for (const p of t.problems) {
        if (ids.has(p.id)) report.warnings.push(`${name}: problem id "${p.id}" repeated in topic "${t.id}".`);
        ids.add(p.id);
        if (p.link) {
          const k = urlKey(p.link), here = `${t.id}/${p.id}`, prev = seenUrls.get(k);
          if (prev && prev !== here) report.warnings.push(`${name}: "${p.title}" has the same URL as ${prev} (kept: the same problem can appear in more than one topic).`);
          seenUrls.set(k, here);
        }
      }
    }
  }
}

function countOnly(items: Parsed[], report: Report) {
  for (const { kind, data } of items) {
    if (kind === "dsa") { const d = data as DsaFile; bump(report, "topics", d.topics.length); bump(report, "problems", d.topics.reduce((a, t) => a + t.problems.length, 0)); }
    if (kind === "core") bump(report, "topics", (data as CoreFile).topics.length);
  }
}

export async function importAll(db: SupabaseClient | null, files: RawFile[], opts: { dryRun: boolean }): Promise<Report> {
  const report: Report = { files: 0, counts: {}, warnings: [], errors: [] };
  const items = parseFiles(files, report);
  checkDuplicates(items, report);
  if (opts.dryRun || !db) { countOnly(items, report); return report; }
  if (report.errors.length) return report; // never import a partially invalid set
  for (const { name, kind, data } of items) {
    try {
      if (kind === "dsa") await importDsa(db, data as DsaFile, report);
      if (kind === "core") await importCore(db, data as CoreFile, report);
    } catch (e) { report.errors.push(`${name}: ${(e as Error).message}`); }
  }
  return report;
}

async function rootId(db: SupabaseClient, slug: string): Promise<string> {
  const { data, error } = await db.from("content_items").select("id").eq("path", slugify(slug)).is("parent_id", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Unknown subject "${slug}". Existing roots: dsa, dbms, os, cn, oop.`);
  return data.id;
}

type Row = Record<string, unknown>;
async function upsert(db: SupabaseClient, rows: Row[]): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await db.from("content_items").upsert(rows.slice(i, i + 200), { onConflict: "path" }).select("id,path");
    if (error) throw new Error(error.message);
    for (const r of data ?? []) ids.set(r.path, r.id);
  }
  return ids;
}

async function importDsa(db: SupabaseClient, d: DsaFile, report: Report) {
  const root = await rootId(db, d.subject && d.subject !== "dsa" ? d.subject : "dsa");
  const rootPath = d.subject && d.subject !== "dsa" ? slugify(d.subject) : "dsa";
  const topicRows = d.topics.map((t, i) => ({ parent_id: root, item_type: "topic", path: `${rootPath}/${slugify(t.id)}`, slug: slugify(t.id), title: t.title, description: t.description ?? null, position: i }));
  const topicIds = await upsert(db, topicRows);
  bump(report, "topics", topicRows.length);
  const rows: Row[] = [];
  d.topics.forEach((t) => {
    const parent = topicIds.get(`${rootPath}/${slugify(t.id)}`);
    const seen = new Set<string>();
    t.problems.forEach((p, i) => {
      const slug = slugify(p.id);
      if (seen.has(slug)) return;
      seen.add(slug);
      rows.push({ parent_id: parent, item_type: "problem", path: `${rootPath}/${slugify(t.id)}/${slug}`, slug, title: p.title, difficulty: p.difficulty ?? null,
        url: p.link ?? null, url_key: p.link ? urlKey(p.link) : null, platform: p.platform ?? (p.link ? hostName(p.link) : null),
        tags: p.tags ?? [], position: i, meta: p.companies ? { companies: p.companies } : {} });
      if (p.resource) rows.push({ parent_id: parent, item_type: "resource", path: `${rootPath}/${slugify(t.id)}/${slug}~resource`, slug: `${slug}-resource`,
        title: `${p.title} — resource`, url: p.resource, url_key: urlKey(p.resource), platform: hostName(p.resource), position: i, meta: { for: slug } });
    });
    (t.resources ?? []).forEach((r, i) => rows.push({ parent_id: parent, item_type: "resource", path: `${rootPath}/${slugify(t.id)}/res-${slugify(r.title)}-${i}`, slug: `res-${i}`,
      title: r.title, url: r.url, url_key: urlKey(r.url), platform: r.provider ?? hostName(r.url), position: 1000 + i }));
  });
  await upsert(db, rows);
  bump(report, "problems", rows.filter((r) => r.item_type === "problem").length);
}

async function importCore(db: SupabaseClient, d: CoreFile, report: Report) {
  const root = await rootId(db, d.subject);
  const sp = slugify(d.subject);
  const rows: Row[] = d.topics.map((t, i) => ({ parent_id: root, item_type: "topic", path: `${sp}/${slugify(t.id)}`, slug: slugify(t.id), title: t.title, description: t.summary ?? null, position: i }));
  const ids = await upsert(db, rows);
  bump(report, "topics", rows.length);
  const res: Row[] = [];
  d.topics.forEach((t) => (t.resources ?? []).forEach((r, i) => res.push({ parent_id: ids.get(`${sp}/${slugify(t.id)}`), item_type: "resource", path: `${sp}/${slugify(t.id)}/res-${slugify(r.title)}-${i}`,
    slug: `res-${i}`, title: r.title, url: r.url, url_key: urlKey(r.url), platform: r.provider ?? hostName(r.url), position: 1000 + i })));
  if (res.length) await upsert(db, res);
}
