import { isDsaRoot } from "@/config/dsa";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filters } from "@/components/Filters";
import { HashOpener } from "@/components/HashOpener";
import { TreeView } from "@/components/TreeView";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { loadTree } from "@/lib/tree";

export default async function Page({ params, searchParams }: { params: Promise<{ subject: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { subject } = await params;
  const sp = await searchParams;
  if (isDsaRoot(subject)) notFound();
  const { supabase, user } = await requireSession();
  const data = await loadTree(supabase, user.id, subject, { status: sp.status, q: sp.q });
  if (!data) notFound();
  return (
    <>
      <Link href="/core" className="mb-3 inline-block text-sm text-muted hover:text-white">← Core CS</Link>
      <PageHeader title={data.root.title} subtitle="Mark topics done as you study them. Add notes, bookmarks and revision flags on any topic." />
      {data.total === 0 ? (
        <Empty title={`No ${data.root.title} topics have been added yet`}>
          Add a file under <code className="text-white">content/import/core</code> and run <code className="text-white">npm run content:import</code>. See <code className="text-white">content/README.md</code>.
        </Empty>
      ) : (
        <>
          <div className="card mb-5">
            <div className="mb-2 flex items-baseline justify-between"><span className="text-sm text-muted">Progress</span><span className="text-sm">{data.completed} / {data.total} done</span></div>
            <ProgressBar value={data.completed} total={data.total} />
          </div>
          <Filters showDifficulty={false} />
          <HashOpener />
          {data.tree.length === 0 ? <Empty title="Nothing matches those filters">Try clearing the search or choosing a different status.</Empty> : <TreeView nodes={data.tree} forceOpen={data.filtered} />}
        </>
      )}
    </>
  );
}
