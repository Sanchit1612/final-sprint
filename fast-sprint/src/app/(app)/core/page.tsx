import { isDsaRoot } from "@/config/dsa";
import Link from "next/link";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { getRoots, loadTree } from "@/lib/tree";

export const metadata = { title: "Core CS" };

export default async function Page() {
  const { supabase, user } = await requireSession();
  const roots = (await getRoots(supabase)).filter((r) => !isDsaRoot(r.slug));
  const stats = await Promise.all(roots.map(async (r) => ({ ...r, t: await loadTree(supabase, user.id, r.slug) })));
  return (
    <>
      <PageHeader title="Core CS" subtitle="DBMS, Operating Systems, Computer Networks and OOP, each as a checklist with notes and bookmarks." />
      {stats.length === 0 ? <Empty title="No subjects found">Run the database migrations to create the four Core CS subjects.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((s) => (
            <Link key={s.id} href={`/core/${s.slug}`} className="card hover-card">
              <h2 className="text-lg">{s.title}</h2>
              {s.t && s.t.total > 0 ? (
                <>
                  <p className="mt-1 text-sm text-muted">{s.t.completed} of {s.t.total} topics done</p>
                  <ProgressBar value={s.t.completed} total={s.t.total} className="mt-4" />
                </>
              ) : <p className="mt-1 text-sm text-muted">No topics added yet.</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
