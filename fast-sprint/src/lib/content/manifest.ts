import { z } from "zod";
import { createHash } from "node:crypto";
const httpURL = z.string().url().refine(v => ["http:", "https:"].includes(new URL(v).protocol), "HTTP(S) URL required");
export interface ContentNode {
  slug: string; title: string; type: "subject" | "topic" | "section" | "problem" | "resource";
  description?: string; url?: string; difficulty?: "easy" | "medium" | "hard"; isPro?: boolean;
  meta?: Record<string, unknown>; children?: ContentNode[];
}
const nodeSchema: z.ZodType<ContentNode> = z.lazy(() => z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(160), title: z.string().trim().min(1),
  type: z.enum(["subject", "topic", "section", "problem", "resource"]), description: z.string().optional(),
  url: httpURL.optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional(), isPro: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(), children: z.array(nodeSchema).optional(),
}).strict());
export const manifestSchema = z.object({ version: z.literal(1), root: nodeSchema }).strict();
export interface ImportRow { id: string; path: string; parentPath: string | null; slug: string; title: string; item_type: ContentNode["type"]; position: number; is_pro: boolean; url: string | null; difficulty: ContentNode["difficulty"] | null; description: string | null; meta: Record<string, unknown> }
export function stableId(path: string) {
  const hex = createHash("sha256").update(`fast-sprint:content:v1:${path}`).digest("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
export function planManifest(input: unknown): ImportRow[] {
  const { root } = manifestSchema.parse(input);
  if (root.type !== "subject") throw new Error("Root must be a subject");
  if (["development","aptitude","behavioural","companies","interview"].includes(root.slug) && !root.isPro) throw new Error("Premium collections must declare Pro at the root");
  const paths = new Set<string>(), problems = new Set<string>(); const rows: ImportRow[] = [];
  const walk = (node: ContentNode, parent: string | null, position: number, premium: boolean, depth: number) => {
    if (depth > 12) throw new Error("Hierarchy exceeds 12 levels");
    const path = parent ? `${parent}/${node.slug}` : node.slug;
    if (paths.has(path)) throw new Error(`Duplicate path: ${path}`); paths.add(path);
    if (parent && node.type === "subject") throw new Error("Nested subject not allowed");
    if (["problem", "resource"].includes(node.type) && node.children?.some(c => c.type !== "resource")) throw new Error("Leaves can only have resource children");
    if (node.type === "resource" && !node.url) throw new Error(`Resource URL missing: ${path}`);
    if (node.type === "problem" && node.url) {
      const u = new URL(node.url); const key = `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
      if (problems.has(key) && root.slug !== "dsa-a2z") throw new Error(`Duplicate problem URL: ${path}`); problems.add(key);
    }
    const is_pro = premium || !!node.isPro;
    if (["dsa-200", "dsa-a2z", "dsa-neetcode150", "dbms", "os", "cn", "oop", "sql"].includes(root.slug) && is_pro) throw new Error("Basic DSA/Core content must be Free");
    rows.push({ id: stableId(path), path, parentPath: parent, slug: node.slug, title: node.title, item_type: node.type, position, is_pro, url: node.url ?? null, description: node.description ?? null, difficulty: node.difficulty ?? null, meta: node.meta ?? {} });
    node.children?.forEach((c, i) => walk(c, path, i, is_pro, depth + 1));
  };
  walk(root, null, 0, false, 0);return rows;
}
interface Database { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> }
/** All writes are atomic. Existing path IDs survive reruns; no deletions or pruning. */
export async function writeManifest(db: Database, input: unknown) {
  const plan = planManifest(input); // Validate everything BEFORE beginning a transaction.
  const ids = new Map<string, string>();
  await db.query("begin");
  try {
    await db.query("select pg_advisory_xact_lock(hashtext($1))", [plan[0].path]);
    for (const row of plan) {
      const { rows } = await db.query(`insert into public.content_items
        (id,parent_id,item_type,path,slug,title,description,url,difficulty,position,is_pro,meta)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        on conflict(path) do update set parent_id=excluded.parent_id,item_type=excluded.item_type,
        slug=excluded.slug,title=excluded.title,description=excluded.description,url=excluded.url,
        difficulty=excluded.difficulty,position=excluded.position,is_pro=excluded.is_pro,meta=excluded.meta
        returning id`, [row.id, row.parentPath ? ids.get(row.parentPath) : null, row.item_type, row.path, row.slug, row.title, row.description, row.url, row.difficulty, row.position, row.is_pro, JSON.stringify(row.meta)]);
      ids.set(row.path, String(rows[0].id));
    }
    // Retired descendants survive non-destructive reimports, but must inherit a newly premium root.
    if (plan[0].is_pro) await db.query("update public.content_items set is_pro=true where path=$1 or left(path,length($1)+1)=$1||'/'",[plan[0].path]);
    await db.query("commit");return { count: plan.length, ids: Object.fromEntries(ids) };
  } catch (e) { await db.query("rollback");throw e; }
}
