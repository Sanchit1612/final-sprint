import { learningHref } from "@/config/dsa";
import { Target } from "lucide-react";
import Link from "next/link";
import { STATUS_LABEL } from "@/components/ApplicationsBoard";
import { TaskList, type TaskItem } from "@/components/TaskList";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { WeeklyChart } from "@/components/WeeklyChart";
import { addDays, formatDay, todayIn } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { fetchAll, getRoots, loadTree } from "@/lib/tree";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  const { supabase, user, profile, tz, today, isPro } = await requireSession();
  const [roots, doneItems, doneTasks, todays, revision, apps] = await Promise.all([
    getRoots(supabase),
    fetchAll<{ completed_at: string }>((a, b) => supabase.from("user_item_progress").select("completed_at").eq("status", "done").not("completed_at", "is", null).order("item_id").range(a, b)),
    fetchAll<{ completed_at: string }>((a, b) => supabase.from("daily_tasks").select("completed_at").eq("status", "done").not("completed_at", "is", null).order("id").range(a, b)),
    fetchAll<TaskItem>((a, b) => supabase.from("daily_tasks").select("id,title,notes,status,task_date").eq("task_date", today).order("sort_order").order("created_at").order("id").range(a, b)),
    supabase.from("user_item_progress").select("item_id", { count: "exact", head: true }).eq("needs_revision", true),
    fetchAll<{ status: string }>((a, b) => supabase.from("applications").select("status").order("id").range(a, b)),
  ]);
  if (revision.error) throw new Error("Could not load revision counts. Please try again.");
  const reviseCount = revision.count;
  const trees = await Promise.all(roots.map(async (r) => ({ root: r, t: await loadTree(supabase, user.id, r.slug) })));

  const perDay = new Map<string, number>();
  for (const r of doneItems) { const d = todayIn(tz, new Date(r.completed_at)); perDay.set(d, (perDay.get(d) ?? 0) + 1); }
  const active = new Set<string>(perDay.keys());
  for (const r of doneTasks) active.add(todayIn(tz, new Date(r.completed_at)));
  let streak = 0;
  for (let d = active.has(today) ? today : addDays(today, -1); active.has(d); d = addDays(d, -1)) streak++;
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(today, i - 6); return { day: formatDay(d, { weekday: "short" }), done: perDay.get(d) ?? 0 }; });
  const weekTotal = week.reduce((a, d) => a + d.done, 0);

  const tasks = (todays ?? []) as TaskItem[];
  const appCounts = new Map<string, number>();
  for (const a of apps ?? []) appCounts.set(a.status, (appCounts.get(a.status) ?? 0) + 1);
  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const withContent = trees.filter((x) => x.t && x.t.total > 0);

  return (
    <>
      <PageHeader title={firstName ? `Hi, ${firstName}` : "Dashboard"} subtitle={formatDay(today, { weekday: "long", day: "numeric", month: "long" })} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2" aria-labelledby="goal">
          <h2 id="goal" className="mb-3 flex items-center gap-2 text-base"><Target className="h-4 w-4 text-accent" aria-hidden />Your goal</h2>
          {profile?.target_role || profile?.target_company ? (
            <p className="text-lg">{profile.target_role ?? "Placement"}{profile.target_company ? <span className="text-muted"> at {profile.target_company}</span> : null}</p>
          ) : <p className="text-sm text-muted">Add a target role and company in <Link href="/settings" className="text-accent hover:underline">Settings</Link> so your goal shows here.</p>}
        </section>
        <section className="card" aria-labelledby="streak">
          <h2 id="streak" className="mb-1 text-base">Streak</h2>
          <p className="text-5xl font-bold tracking-tight text-accent">{streak}<span className="ml-1 text-sm font-normal text-muted">{streak === 1 ? "day" : "days"}</span></p>
          <p className="mt-1 text-xs text-muted">{streak ? "Days in a row with a completed item or task." : "Finish an item or task today to start one."}</p>
        </section>

        <section className="card lg:col-span-2" aria-labelledby="progress">
          <h2 id="progress" className="mb-4 text-base">Preparation progress</h2>
          {withContent.length === 0 ? (
            <Empty title="No checklist content yet">Progress appears here once DSA or Core CS content is imported. See <code className="text-white">content/README.md</code>.</Empty>
          ) : (
            <div className="space-y-4">
              {withContent.map(({ root, t }) => (
                <Link key={root.id} href={learningHref(root.slug)} className="block rounded-xl p-1 hover:bg-white/[0.03]">
                  <div className="mb-1.5 flex justify-between text-sm"><span>{root.title}</span><span className="text-muted">{t!.completed}/{t!.total}</span></div>
                  <ProgressBar value={t!.completed} total={t!.total} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="today">
          <div className="mb-3 flex items-center justify-between"><h2 id="today" className="text-base">Today&apos;s sprint</h2><Link href="/sprint" className="text-xs text-accent hover:underline">Open</Link></div>
          {tasks.length === 0 ? <p className="text-sm text-muted">No tasks yet. <Link href="/sprint" className="text-accent hover:underline">Plan your day</Link>.</p> : <TaskList tasks={tasks.slice(0, 6)} />}
        </section>

        <section className="card lg:col-span-2" aria-labelledby="week">
          <div className="mb-3 flex items-baseline justify-between"><h2 id="week" className="text-base">This week</h2><span className="text-xs text-muted">{weekTotal} completed in 7 days</span></div>
          {weekTotal === 0 ? <p className="py-8 text-center text-sm text-muted">Completed items will show up here as you work.</p> : <WeeklyChart data={week} />}
        </section>

        <div className="space-y-4">
          <section className="card" aria-labelledby="rev">
            <h2 id="rev" className="mb-1 text-base">Needs revision</h2>
            <p className="text-5xl font-bold tracking-tight text-accent">{reviseCount ?? 0}</p>
            <Link href="/saved?tab=revision" className="mt-1 inline-block text-xs text-accent hover:underline">View list</Link>
          </section>
          <section className="card" aria-labelledby="apps">
            <div className="mb-2 flex items-center justify-between"><h2 id="apps" className="text-base">Applications</h2><Link href="/applications" className="text-xs text-accent hover:underline">Open</Link></div>
            {appCounts.size === 0 ? <p className="text-sm text-muted">None tracked yet.</p> : (
              <ul className="space-y-1 text-sm">{[...appCounts].map(([s, n]) => <li key={s} className="flex justify-between"><span className="text-muted">{STATUS_LABEL[s]}</span><span>{n}</span></li>)}</ul>
            )}
          </section>
        </div>
      </div>
      {!isPro && <p className="mt-6 text-xs text-muted">You are on the Free plan. <Link href="/pricing" className="text-accent hover:underline">Compare plans</Link></p>}
    </>
  );
}
