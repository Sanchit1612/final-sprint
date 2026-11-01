import { Filters } from "@/components/Filters";
import { HashOpener } from "@/components/HashOpener";
import { TreeView } from "@/components/TreeView";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { loadTree } from "@/lib/tree";

export const metadata = { title: "DSA" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireSession();
  const data = await loadTree(supabase, user.id, "dsa", { difficulty: sp.difficulty, status: sp.status, q: sp.q });
  return (
    <>
      <PageHeader title="DSA" subtitle="Tick problems off as you solve them on LeetCode, GeeksforGeeks and other sites. Links open in a new tab." />
      {!data || data.total === 0 ? (
        <Empty title="No DSA problems have been added yet">
          The checklist fills in once your problem sheet is imported. Run <code className="text-white">npm run content:import</code> after adding files to <code className="text-white">content/import/dsa</code>. See <code className="text-white">content/README.md</code>.
        </Empty>
      ) : (
        <>
          <div className="card mb-5">
            <div className="mb-2 flex items-baseline justify-between"><span className="text-sm text-muted">Overall progress</span><span className="text-sm">{data.completed} / {data.total} done</span></div>
            <ProgressBar value={data.completed} total={data.total} />
          </div>
          <Filters />
          <HashOpener />
          {data.tree.length === 0 ? <Empty title="Nothing matches those filters">Try clearing the search or choosing a different status.</Empty> : <TreeView nodes={data.tree} forceOpen={data.filtered} />}
        </>
      )}
    </>
  );
}
