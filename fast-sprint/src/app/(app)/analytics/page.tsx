import Link from "next/link";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { PageHeader, ProgressBar } from "@/components/ui";
import { activitySummary, completionTrends } from "@/lib/activity";
import { requireSession } from "@/lib/session";
import { fetchAll, getRoots, loadTree } from "@/lib/tree";
import { learningHref } from "@/config/dsa";
export const metadata={title:"Analytics"};
export default async function Page(){
 const {supabase,user,tz,isPro}=await requireSession();
 const [items,tasks,roots]=await Promise.all([
 fetchAll<{completed_at:string}>((a,b)=>supabase.from("user_item_progress").select("completed_at").eq("user_id",user.id).eq("status","done").not("completed_at","is",null).order("item_id").range(a,b)),
 fetchAll<{completed_at:string}>((a,b)=>supabase.from("daily_tasks").select("completed_at").eq("user_id",user.id).eq("status","done").not("completed_at","is",null).order("id").range(a,b)),getRoots(supabase)]);
 const activity=activitySummary([...items,...tasks].map(r=>r.completed_at),tz);
 const trees=await Promise.all(roots.map(async r=>({root:r,data:await loadTree(supabase,user.id,r.slug)})));
 const available=trees.filter(t=>t.data&&t.data.total>0),total=available.reduce((n,t)=>n+t.data!.total,0),done=available.reduce((n,t)=>n+t.data!.completed,0);
 // Detailed rows are constructed/rendered only after the server entitlement check.
 const details=isPro?available.flatMap(({root,data})=>data!.tree.map(n=>({subject:root.title,id:n.id,title:n.title,total:n.total,done:n.completed,percentage:n.total?Math.round(n.completed/n.total*100):0}))).sort((a,b)=>a.percentage-b.percentage):null;
 const trends=isPro?completionTrends(activity.days,activity.today):null;
 const activeDays=Object.keys(activity.days).length;
 return <><PageHeader title="Your preparation, in view" subtitle="Progress from your saved checklist completions and daily tasks."/>
 <div className="mb-5 grid gap-3 sm:grid-cols-3">{[["Checklist complete",`${done} / ${total}`],["Current streak",`${activity.current} ${activity.current===1?"day":"days"}`],["Longest recorded run",`${activity.longest} ${activity.longest===1?"day":"days"}`]].map(([title,value])=><section key={title} className="card"><h2 className="text-sm text-muted">{title}</h2><p className="mt-2 text-3xl text-accent">{value}</p></section>)}</div>
 <p className="mb-5 text-sm text-muted">A day is active when it has a saved checklist or task completion. Today may still be in progress, so a streak can end yesterday. These are completion snapshots: unchecking, re-completing or deleting records can change past counts. Durable history is awaiting an approved database change. Collections track progress independently.</p>
 <ActivityCalendar days={activity.days} timezone={tz} initialToday={activity.today}/>
 <section className="card mt-5"><h2 className="text-xl">Subject and collection progress</h2>{!available.length?<p className="mt-3 text-muted">Progress will appear when reviewed learning collections are published.</p>:<div className="mt-4 space-y-4">{available.map(({root,data})=><Link key={root.id} className="block" href={learningHref(root.slug)}><p className="mb-2 text-sm">{root.title} · {data!.completed}/{data!.total}</p><ProgressBar value={data!.completed} total={data!.total}/></Link>)}</div>}</section>
 {trends&&<section className="card mt-5"><h2 className="text-xl">Completion trends · Pro</h2><p className="mt-2 text-sm text-muted">Current saved completion timestamps; edits can change these historical snapshots.</p><div className="mt-4 grid gap-6 md:grid-cols-2"><div><h3 className="mb-2 text-base">Last 8 weeks</h3><ul className="space-y-2 text-sm">{trends.weekly.map(w=><li key={w.start} className="flex justify-between gap-2"><span className="text-muted">Week of {w.start}</span><span>{w.completions}</span></li>)}</ul></div><div><h3 className="mb-2 text-base">Last 6 months</h3><ul className="space-y-2 text-sm">{trends.monthly.map(m=><li key={m.month} className="flex justify-between gap-2"><span className="text-muted">{m.month}</span><span>{m.completions}</span></li>)}</ul></div></div></section>}
 {details?<section className="card mt-5"><h2 className="text-xl">Detailed coverage · Pro</h2><p className="mt-2 text-sm text-muted">{activeDays} active recorded days. Lower completion identifies areas to review, not measured ability or predicted interview performance. No solving speed or accuracy is inferred.</p>{!details.length?<p className="mt-3 text-muted">Detailed coverage appears after content is published.</p>:<ul className="mt-4 space-y-3">{details.map(d=><li key={d.id}><p className="text-sm">{d.subject} / {d.title} · {d.done}/{d.total} · {d.percentage}% covered</p><ProgressBar className="mt-2" value={d.done} total={d.total}/></li>)}</ul>}</section>:<section className="card mt-5"><h2 className="text-xl">Go deeper with Pro</h2><p className="mt-2 text-sm text-muted">Compare detailed group coverage and identify the least-completed areas of your plan.</p><Link className="btn-ghost mt-4" href="/pricing">Compare plans</Link></section>}
 </>;
}
