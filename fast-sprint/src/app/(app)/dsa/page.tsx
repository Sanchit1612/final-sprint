import { learningHref } from "@/config/dsa";
import Link from "next/link";
import { DSA_COLLECTIONS, dsaCollection } from "@/config/dsa";
import { difficultyCounts } from "@/lib/dsa/stats";
import { Filters } from "@/components/Filters";
import { HashOpener } from "@/components/HashOpener";
import { TreeView } from "@/components/TreeView";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { loadLearningTree } from "@/lib/content/preview";

export const metadata = { title: "DSA" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const session=await getSession(),supabase=session?.supabase??await createClient(),user=session?.user;
  const collection = dsaCollection(sp.collection);
  const legacy = sp.collection === "legacy";
  const root = legacy ? "dsa" : collection.root;
  const data = await loadLearningTree(supabase, user?.id??'', root, { difficulty: sp.difficulty, status: sp.status, q: sp.q });
  const patterns = data?.tree ?? [];
  const visible = sp.pattern ? patterns.filter(n => n.id === sp.pattern) : patterns;
  const distribution = difficultyCounts(visible);
  const pct = data?.total ? Math.round(data.completed / data.total * 100) : 0;
  return (
    <>
      <PageHeader title={legacy ? "Existing DSA checklist" : collection.title} subtitle={legacy ? "Your original checklist and saved progress." : collection.description} />
      <nav aria-label="DSA collections" className="mb-6 grid gap-3 md:grid-cols-3">
        {DSA_COLLECTIONS.map(c => <Link key={c.key} href={`/dsa?collection=${c.key}`} aria-current={!legacy && collection.key === c.key ? "page" : undefined} className={`card !p-4 ${!legacy && collection.key === c.key ? "border-accent" : "hover-card"}`}><p className="text-xs text-accent">Free collection</p><h2 className="mt-1 text-base">{c.title}</h2><p className="mt-2 text-xs text-muted">{c.description}</p></Link>)}
      </nav>
      {!legacy && <Link href="/dsa?collection=legacy" className="mb-4 inline-block text-xs text-muted hover:text-white">Open existing checklist</Link>}
      {!user&&<p className="card mb-5 text-sm">These sheets and problem links are Free. <Link className="text-accent" href={`/login?next=${encodeURIComponent('/dsa?collection='+collection.key)}`}>Sign in to save progress, bookmarks and notes →</Link></p>}
      {!data || data.total === 0 ? (
        <Empty title="This collection is being prepared">Verified problem links and learning order will appear here after content review. No problems have been published to this collection yet.</Empty>
      ) : (
        <>
          {(!data.preview||data.synced) && <div className="card mb-5">
            <div className="mb-2 flex items-baseline justify-between"><span className="text-sm text-muted">Overall progress</span><span className="text-sm">{data.completed} / {data.total} done · {pct}%</span></div>
            <ProgressBar value={data.completed} total={data.total} />
          </div>}
          <Filters key={`filters:${root}`} showStatus={!!user} patterns={data.patterns} />
          <p className="mb-4 text-xs text-muted">Visible problems: {distribution.easy} Easy · {distribution.medium} Medium · {distribution.hard} Hard{distribution.unspecified ? ` · ${distribution.unspecified} without difficulty` : ""}</p>
          <HashOpener key={`hash:${root}`}/>
          {visible.length === 0 ? <Empty title="Nothing matches those filters">Try clearing the search or choosing a different status.</Empty> : <TreeView signInHref={!user?`/login?next=${encodeURIComponent("/dsa?collection="+collection.key)}`:undefined} key={`tree:${root}`} localStudy={data.preview&&user ? { user: user.id, href: learningHref(root),root,cloud:data.synced } : undefined} nodes={visible} readOnly={!user||data.preview} forceOpen={data.filtered || !!sp.pattern} />}
        </>
      )}
    </>
  );
}
