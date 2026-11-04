import {LockedFeatures} from "@/components/LockedFeatures";
import {AssessmentInsights} from "@/components/AssessmentInsights";
import {CompanyPreparationSummary} from "@/components/CompanyPreparationSummary";
import {companyTrackingEnabled} from "@/lib/company-progress";
import {RevisionQueue} from "@/components/RevisionQueue";
import {loadCoverage} from '@/lib/coverage';
import Link from 'next/link';
import {ActivityCalendar} from '@/components/ActivityCalendar';
import {CompletionGraph} from '@/components/CompletionGraph';
import {PageHeader,ProgressBar} from '@/components/ui';
import {activitySummary,completionTrends} from '@/lib/activity';
import {requireSession} from '@/lib/session';
import {fetchAll} from '@/lib/tree';
import {learningHref} from '@/config/dsa';
import {chooseFocus,preparationMoves,nextIncomplete} from '@/lib/analytics-focus';
export const metadata={title:'Analytics'};
export default async function Page({searchParams}:{searchParams:Promise<{focus?:string}>}) {
 const {supabase,user,tz,isPro}=await requireSession(),sp=await searchParams;
 const [items,tasks,trees]=await Promise.all([
 fetchAll<{completed_at:string}>((a,b)=>supabase.from('user_item_progress').select('completed_at').eq('user_id',user.id).eq('status','done').not('completed_at','is',null).order('item_id').range(a,b)),
 fetchAll<{completed_at:string}>((a,b)=>supabase.from('daily_tasks').select('completed_at').eq('user_id',user.id).eq('status','done').not('completed_at','is',null).order('id').range(a,b)),loadCoverage(supabase,user.id)]);
 const activity=activitySummary([...items,...tasks].map(r=>r.completed_at),tz),available=trees.filter(t=>t.data.total>0),focus=chooseFocus(available,sp.focus);
 const trends=isPro?completionTrends(activity.days,activity.today):null;
 const groups=isPro?focus?.data.tree??[]:[],moves=preparationMoves(groups),revision=groups.reduce((s,g)=>s+g.revision,0),untouched=groups.filter(g=>!g.completed).length;
 return <><PageHeader title="Your preparation, in view" subtitle="Know what to practise next, build consistency and see your progress."/>
 <form className="mb-5 flex flex-wrap items-center gap-3"><label htmlFor="analytics-focus" className="text-sm">Your focus</label><select id="analytics-focus" className="input !w-auto max-w-full" name="focus" defaultValue={focus?.root.slug}>{available.map(c=><option key={c.root.id} value={c.root.slug}>{c.root.title}</option>)}</select><button className="btn-ghost">Apply</button><span className="text-xs text-muted">Defaults to your most recently updated checklist.</span></form>
 <div className="mb-5 grid gap-3 sm:grid-cols-3">{[['Completed in your focus',`${focus?.data.completed??0} / ${focus?.data.total??0}`],['Current streak',`${activity.current} ${activity.current===1?'day':'days'}`],['Longest recorded run',`${activity.longest} ${activity.longest===1?'day':'days'}`]].map(([title,value])=><section key={title} className="card"><h2 className="text-sm text-muted">{title}</h2><p className="mt-2 text-3xl font-extrabold tracking-tight text-accent">{value}</p></section>)}</div>
 <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]"><ActivityCalendar days={activity.days} timezone={tz} initialToday={activity.today}/><CompletionGraph weeks={trends?.weekly??null}/></div>
 {isPro&&focus&&<><section className="card mt-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl">Your next preparation moves</h2><p className="mt-2 text-sm text-muted">{focus.root.title} · review flagged items first, then continue a pattern you have started.</p></div><Link href="/sprint#planner" className="btn-ghost">Plan your week →</Link></div><div className="mt-4 grid gap-3 md:grid-cols-3">{moves.map(g=>{const next=nextIncomplete(g);return <Link key={g.id} href={`${learningHref(focus.root.slug)}#${g.revision?g.id:next?.id??g.id}`} className="rounded-xl border border-line p-4 hover:border-accent"><span className="text-xs text-accent">{g.revision?'Revision priority':g.completed?'Keep going':'Explore a new pattern'}</span><h3 className="mt-2">{g.title} →</h3><p className="mt-2 text-sm text-muted">{g.revision?`${g.revision} flagged for revision`:`${g.total-g.completed} remaining`}</p><p className="mt-2 text-xs">{g.revision?'Revisit your flagged problems in this pattern.':next?`Next: ${next.title}`:'All complete'}</p></Link>})}</div>{!moves.length&&<p className="mt-4">You have completed this collection with no revision flags. Revisit a pattern below or choose another focus.</p>}</section>
 <section className="card mt-5"><h2 className="text-xl">Pattern Explorer</h2>{!focus.data.completed&&!revision&&<p className="mt-2 text-sm text-muted">No checklist activity yet. Open a pattern to start practising.</p>}<p className="mt-2 text-sm text-muted">{untouched} untouched patterns · {revision} revision flags. Open any pattern to work on it.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{groups.map(g=><Link key={g.id} href={`${learningHref(focus.root.slug)}#${g.id}`} className={`rounded-xl border p-3 ${g.completed===g.total?'border-success/40 bg-success/5':g.revision?'border-accent/50 bg-accent-soft':'border-line'}`}><div className="flex justify-between gap-2 text-sm"><span>{g.title}</span><strong className="shrink-0">{g.completed}/{g.total}</strong></div><ProgressBar className="mt-2" value={g.completed} total={g.total}/><p className="mt-2 text-xs text-muted">{g.revision?`${g.revision} to revise`:g.completed===g.total?'Checklist complete':g.completed?'In progress':'Not started'}</p></Link>)}</div></section>
 <section className="card mt-5"><h2 className="text-xl">Difficulty balance</h2><p className="mt-2 text-sm text-muted">Difficulty coverage within {focus.root.title}.</p><div className="mt-4 grid gap-4 sm:grid-cols-3">{focus.data.difficulty.map(d=><div key={d.level}><div className="flex justify-between text-sm"><h3 className="capitalize">{d.level}</h3><span>{d.done}/{d.total}</span></div><ProgressBar className="mt-2" value={d.done} total={d.total}/></div>)}</div></section></>}
 {isPro&&!focus&&<section className="card mt-5"><h2 className="text-xl">Pattern Explorer</h2><p className="mt-2 text-sm text-muted">No checklist data yet. Published collections will appear here when available.</p></section>}
 {!isPro&&<LockedFeatures features={[
  ["Next preparation moves", "See what to revise first and which problem to tackle next."],
  ["Pattern Explorer", "See completed, untouched and flagged patterns in your chosen collection."],
  ["Difficulty balance", "Compare your progress across easy, medium and hard questions."],
  ["Blind Spot Radar", "Spot topics you repeatedly miss across separate mocks."],
  ["Mock answer breakdown", "See which concepts account for the most incorrect or skipped answers."],
  ["Company preparation", "Track progress against your target company’s priority list."],
 ]}/>}
 {isPro&&<AssessmentInsights user={user.id}/>}
 {isPro&&<CompanyPreparationSummary db={supabase} user={user.id}/>}
 <RevisionQueue db={supabase} user={user.id} today={activity.today}/>
 <section className="card mt-5"><h2 className="text-xl">Your collections</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{available.map(({root,data})=><Link key={root.id} className="block rounded-xl border border-line p-3" href={learningHref(root.slug)}><p className="mb-2 text-sm">{root.title} · <strong className="text-accent">{data.completed}/{data.total}</strong></p><ProgressBar value={data.completed} total={data.total}/></Link>)}</div>{!available.length&&<p className="mt-3 text-muted">Your account progress will appear here as you complete synced checklists.</p>}</section>
 <details className="mt-5 text-xs text-muted"><summary className="cursor-pointer">How these numbers work</summary><p className="mt-2">Coverage measures your saved checklist, not ability or interview readiness. Collections track progress independently. Calendar counts include checklist and daily-task completions. Unchecking, re-completing or deleting records can change these snapshots. Browser saves stay on the current device. Revision flags are self-reported. {companyTrackingEnabled()?"Confidence schedules track the current review state; due dates use your profile timezone.":"Confidence scheduling is not enabled."}</p></details>
 </>;
}
