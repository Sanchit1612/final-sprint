"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function Filters({ showDifficulty = true, showStatus = true, patterns }: { showDifficulty?: boolean; showStatus?: boolean; patterns?: { id: string; title: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!v || v === "all") next.delete(k); else next.set(k, v);
    router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  useEffect(() => { setQ(sp.get('q')??''); },[sp]);

  const active = sp.get("q") || sp.get("difficulty") || sp.get("status") || sp.get("pattern");
  return (
    <form className="mb-5 flex flex-wrap items-center gap-2" onSubmit={e=>{e.preventDefault();set('q',q.trim());}}>
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input className="input !pl-9" placeholder="Search by title" aria-label="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <button type="submit" className="btn-ghost !py-2">Search</button>
      {patterns && <select className="input !w-auto max-w-full" aria-label="Pattern" value={sp.get("pattern") ?? "all"} onChange={e => set("pattern", e.target.value)}><option value="all">All patterns</option>{patterns.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>}
      {showDifficulty && (
        <select className="input !w-auto" aria-label="Difficulty" value={sp.get("difficulty") ?? "all"} onChange={(e) => set("difficulty", e.target.value)}>
          <option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      )}
      {showStatus && <select className="input !w-auto" aria-label="Status" value={sp.get("status") ?? "all"} onChange={(e) => set("status", e.target.value)}>
        <option value="all">Everything</option><option value="todo">To do</option><option value="done">Done</option><option value="revise">Needs revision</option><option value="bookmarked">Bookmarked</option>
      </select>}
      {active && <button type="button" className="btn-ghost !py-2" onClick={() => { setQ(""); const next = new URLSearchParams(sp.toString()); ["q", "difficulty", "status", "pattern"].forEach(k => next.delete(k)); router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false }); }}>Clear</button>}
    </form>
  );
}
