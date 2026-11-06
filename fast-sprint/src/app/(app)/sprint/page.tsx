import { LockedFeatures } from "@/components/LockedFeatures";
import {RedistributeTasks} from "@/components/RedistributeTasks";
import {CountdownPlanner} from "@/components/CountdownPlanner";
import {loadCoverage} from "@/lib/coverage";
import {chooseFocus,type CoverageGroup} from "@/lib/analytics-focus";
import {learningHref} from "@/config/dsa";
import type {FocusItem} from "@/lib/schedule/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AddTaskForm } from "@/components/AddTaskForm";
import { TaskList, type TaskItem } from "@/components/TaskList";
import { Empty, PageHeader, ProgressBar } from "@/components/ui";
import { addDays, formatDay, isISODate } from "@/lib/dates";
import { fetchAll } from "@/lib/tree";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Daily Sprint" };

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const { supabase, today, isPro, user, profile } = await requireSession();
  const date = sp.date && isISODate(sp.date) ? sp.date : today;
  const [dayTasks, overdue] = await Promise.all([
    fetchAll<TaskItem>((a, b) => supabase.from("daily_tasks").select("id,title,notes,status,task_date").eq("task_date", date).order("sort_order").order("created_at").order("id").range(a, b)),
    fetchAll<TaskItem>((a, b) => supabase.from("daily_tasks").select("id,title,notes,status,task_date").lt("task_date", today).eq("status", "pending").order("task_date").order("id").range(a, b)),
  ]);
  const coverage=await loadCoverage(supabase,user.id,isPro,false);
  function leaves(nodes:CoverageGroup[],slug:string,review=false):FocusItem[]{return nodes.flatMap(n=>n.children.length?leaves(n.children,slug,review):((review?n.revision>0:n.completed===0)?[{id:n.id,title:n.title,href:`${learningHref(slug)}#${n.id}`,entityType:"problem"}]:[]));}
  const dsa=coverage.filter(c=>c.root.slug.startsWith("dsa")&&c.data.total),active=chooseFocus(dsa);
  dsa.sort((a,b)=>Number(b===active)-Number(a===active));
  const tasks = (dayTasks ?? []) as TaskItem[];
  const done = tasks.filter((t) => t.status === "done").length;
  const missed = (overdue ?? []) as TaskItem[];

  return (
    <>
      <PageHeader title="Daily Sprint" subtitle="A simple list of what you commit to each day." />
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link aria-label="Previous day" href={`/sprint?date=${addDays(date, -1)}`} className="btn-ghost !px-2.5"><ChevronLeft className="h-4 w-4" /></Link>
          <Link aria-label="Next day" href={`/sprint?date=${addDays(date, 1)}`} className="btn-ghost !px-2.5"><ChevronRight className="h-4 w-4" /></Link>
          {date !== today && <Link href="/sprint" className="btn-ghost">Today</Link>}
        </div>
        <h2 className="text-lg">{date === today ? "Today, " : ""}{formatDay(date)}</h2>
      </div>

      <section className="card">
        {tasks.length > 0 && (
          <div className="mb-4"><div className="mb-1.5 flex justify-between text-xs text-muted"><span>{done} of {tasks.length} done</span></div><ProgressBar value={done} total={tasks.length} /></div>
        )}
        {tasks.length === 0 ? <p className="mb-4 text-sm text-muted">No tasks for this day yet. Add your first one below.</p> : <div className="mb-4"><TaskList tasks={tasks} /></div>}
        <AddTaskForm date={date} />
        {!isPro && <p className="mt-3 text-xs text-muted">Free plan: up to 5 tasks per day. <Link href="/pricing" className="text-accent hover:underline">See Pro</Link></p>}
      {!isPro && <LockedFeatures features={[["Unlimited daily tasks", "Plan longer study days beyond the Free limit of five tasks."]]} />}
      </section>

      <CountdownPlanner today={today} role={profile?.target_role??""} collections={dsa.map(c=>({slug:c.root.slug,title:c.root.title,remaining:leaves(c.data.tree,c.root.slug)}))} core={coverage.filter(c=>!c.root.slug.startsWith("dsa")).flatMap(c=>leaves(c.data.tree,c.root.slug))} revision={coverage.flatMap(c=>leaves(c.data.tree,c.root.slug,true))}/>
      {missed.length > 0 && (
        <section className="card mt-6">
          <h2 className="text-lg">Missed tasks</h2>
          <p className="mb-2 text-sm text-muted">Unfinished from earlier days. Move them to today, or delete them.</p>
          <RedistributeTasks/>
          <TaskList tasks={missed} moveTo={today} />
        </section>
      )}
      {tasks.length === 0 && missed.length === 0 && date === today && <div className="mt-6"><Empty title="A clear day">Tasks you add show up here and on your dashboard.</Empty></div>}
    </>
  );
}
