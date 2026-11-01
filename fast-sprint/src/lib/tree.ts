import type { SupabaseClient } from "@supabase/supabase-js";

export interface Res { id: string; title: string; url: string | null; platform: string | null }
export interface TreeNode {
  id: string; type: string; title: string; description: string | null; url: string | null; platform: string | null;
  difficulty: "easy" | "medium" | "hard" | null; tags: string[]; position: number;
  children: TreeNode[]; resources: Res[];
  checkable: boolean; done: boolean; revise: boolean; bookmarked: boolean; note: string;
  total: number; completed: number;
}
export interface Filters { difficulty?: string; status?: string; q?: string }

interface Row {
  id: string; parent_id: string | null; item_type: string; title: string; description: string | null; url: string | null;
  platform: string | null; difficulty: "easy" | "medium" | "hard" | null; tags: string[]; position: number; meta: { for?: string } | null; slug: string;
}

/** PostgREST returns at most 1000 rows per request, so page through. */
export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function getRoots(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("content_items").select("id,slug,title,description,position").is("parent_id", null).order("position");
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; slug: string; title: string; description: string | null; position: number }[];
}

export async function loadTree(supabase: SupabaseClient, userId: string, rootSlug: string, filters: Filters = {}) {
  const { data: root, error: rootError } = await supabase.from("content_items").select("id,slug,title,description").eq("path", rootSlug).is("parent_id", null).maybeSingle();
  if (rootError) throw new Error(rootError.message);
  if (!root) return null;
  const rows = await fetchAll<Row>((a, b) =>
    supabase.from("content_items").select("id,parent_id,item_type,title,description,url,platform,difficulty,tags,position,meta,slug")
      .eq("root_id", root.id).neq("id", root.id).order("position").order("id").range(a, b));
  const ids = rows.map((r) => r.id);
  const inChunks = async <T,>(table: string, cols: string) => {
    const out: T[] = [];
    for (let i = 0; i < ids.length; i += 150) {
      const { data, error } = await supabase.from(table).select(cols).eq("user_id", userId).in("item_id", ids.slice(i, i + 150));
      if (error) throw new Error(error.message);
      out.push(...((data ?? []) as T[]));
    }
    return out;
  };
  const [prog, marks, notes] = await Promise.all([
    inChunks<{ item_id: string; status: string; needs_revision: boolean }>("user_item_progress", "item_id,status,needs_revision"),
    inChunks<{ item_id: string }>("user_bookmarks", "item_id"),
    inChunks<{ item_id: string; body: string }>("user_notes", "item_id,body"),
  ]);
  const pMap = new Map(prog.map((p) => [p.item_id, p]));
  const bSet = new Set(marks.map((m) => m.item_id));
  const nMap = new Map(notes.map((n) => [n.item_id, n.body]));

  const nodes = new Map<string, TreeNode>();
  for (const r of rows) {
    if (r.item_type === "resource") continue;
    const p = pMap.get(r.id);
    nodes.set(r.id, {
      id: r.id, type: r.item_type, title: r.title, description: r.description, url: r.url, platform: r.platform, difficulty: r.difficulty,
      tags: r.tags ?? [], position: r.position, children: [], resources: [], checkable: false,
      done: p?.status === "done", revise: !!p?.needs_revision, bookmarked: bSet.has(r.id), note: nMap.get(r.id) ?? "", total: 0, completed: 0,
    });
  }
  const top: TreeNode[] = [];
  for (const r of rows) {
    if (r.item_type === "resource") continue;
    const node = nodes.get(r.id)!;
    const parent = r.parent_id && r.parent_id !== root.id ? nodes.get(r.parent_id) : null;
    (parent ? parent.children : top).push(node);
  }
  for (const r of rows) {
    if (r.item_type !== "resource") continue;
    const res: Res = { id: r.id, title: r.title, url: r.url, platform: r.platform };
    const parent = r.parent_id ? nodes.get(r.parent_id) : null;
    if (!parent) continue;
    const forSlug = r.meta?.for;
    const target = forSlug ? parent.children.find((c) => c.title && slugOf(rows, c.id) === forSlug) ?? parent : parent;
    target.resources.push(res);
  }
  const f = normalise(filters);
  const prune = (n: TreeNode): TreeNode | null => {
    n.checkable = n.children.length === 0;
    if (n.checkable) {
      n.total = 1; n.completed = n.done ? 1 : 0;
      return matches(n, f) ? n : null;
    }
    n.children = n.children.map(prune).filter((c): c is TreeNode => c !== null);
    n.total = n.children.reduce((a, c) => a + c.total, 0);
    n.completed = n.children.reduce((a, c) => a + c.completed, 0);
    return n.children.length ? n : null;
  };
  // Totals must reflect the unfiltered tree, so count first, then filter.
  const countAll = (n: TreeNode): void => {
    if (n.children.length === 0) { n.total = 1; n.completed = n.done ? 1 : 0; return; }
    n.children.forEach(countAll);
    n.total = n.children.reduce((a, c) => a + c.total, 0);
    n.completed = n.children.reduce((a, c) => a + c.completed, 0);
  };
  top.forEach(countAll);
  const totals = { total: top.reduce((a, c) => a + c.total, 0), completed: top.reduce((a, c) => a + c.completed, 0) };
  const patterns = top.map(n => ({ id: n.id, title: n.title }));
  const filtered = isFiltered(f) ? top.map(prune).filter((n): n is TreeNode => n !== null) : top.map((n) => { markCheckable(n); return n; });
  return { root, tree: filtered, ...totals, filtered: isFiltered(f), patterns };
}

function markCheckable(n: TreeNode) { n.checkable = n.children.length === 0; n.children.forEach(markCheckable); }
const slugCache = new WeakMap<Row[], Map<string, string>>();
function slugOf(rows: Row[], id: string) {
  let m = slugCache.get(rows);
  if (!m) { m = new Map(rows.map((r) => [r.id, r.slug])); slugCache.set(rows, m); }
  return m.get(id);
}
function normalise(f: Filters) {
  return { difficulty: f.difficulty && f.difficulty !== "all" ? f.difficulty : "", status: f.status && f.status !== "all" ? f.status : "", q: (f.q ?? "").trim().toLowerCase() };
}
const isFiltered = (f: ReturnType<typeof normalise>) => Boolean(f.difficulty || f.status || f.q);
function matches(n: TreeNode, f: ReturnType<typeof normalise>) {
  if (f.difficulty && n.difficulty !== f.difficulty) return false;
  if (f.status === "todo" && n.done) return false;
  if (f.status === "done" && !n.done) return false;
  if (f.status === "revise" && !n.revise) return false;
  if (f.status === "bookmarked" && !n.bookmarked) return false;
  if (f.q && !n.title.toLowerCase().includes(f.q)) return false;
  return true;
}
