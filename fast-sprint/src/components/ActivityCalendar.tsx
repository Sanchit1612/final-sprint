"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { calendarDays, shiftMonth } from "@/lib/activity";
import { formatDay, todayIn, WEEKDAY_LABELS } from "@/lib/dates";
export function ActivityCalendar({ days, timezone, initialToday }: { days: Record<string,number>; timezone: string; initialToday: string }) {
 const router=useRouter();
 const [today,setToday]=useState(initialToday),[offset,setOffset]=useState(0),[selected,setSelected]=useState(initialToday);
 useEffect(()=>{const timer=setInterval(()=>{const day=todayIn(timezone);setToday(day);if(day!==initialToday)router.refresh();},30_000);return()=>clearInterval(timer);},[timezone,initialToday,router]);
 const month=shiftMonth(today.slice(0,7),offset), grid=calendarDays(month);
 const monthCount=Object.entries(days).filter(([d])=>d.startsWith(month)).reduce((sum,[,n])=>sum+n,0);
 return <section className="card w-full max-w-md" aria-label="Learning activity calendar">
  <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg">{formatDay(`${month}-01`,{month:"long",year:"numeric"})}</h2><div className="flex gap-1"><button className="btn-ghost !px-2 !py-1.5 text-xs" aria-label="Previous month" onClick={()=>setOffset(o=>o-1)}>←</button><button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={()=>{setOffset(0);setSelected(today);}}>This month</button><button className="btn-ghost !px-2 !py-1.5 text-xs" aria-label="Next month" onClick={()=>setOffset(o=>o+1)}>→</button></div></div>
  <p className="mt-2 text-sm text-muted">{monthCount} recorded completions · {timezone}</p>
  <div className="mt-3 grid grid-cols-7 gap-1 text-center">
   {WEEKDAY_LABELS.map(d=><div key={d} className="py-1 text-xs text-muted">{d}</div>)}
   {grid.map(d=><button key={d} type="button" aria-pressed={selected===d} aria-current={d===today?"date":undefined} aria-label={`${formatDay(d,{day:"numeric",month:"long",year:"numeric"})}: ${days[d]??0} completions`} onClick={()=>setSelected(d)} className={`aspect-square min-h-8 rounded-lg border p-1 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected===d?"border-accent":"border-transparent"} ${days[d]?"bg-accent-soft text-accent":"bg-surface-2"} ${d.startsWith(month)?"":"opacity-40"}`}><span>{Number(d.slice(-2))}</span>{!!days[d]&&<span aria-hidden className="mx-auto mt-1 block h-1 w-1 rounded-full bg-accent"/>}</button>)}
  </div><p role="status" className="mt-3 text-xs">{formatDay(selected,{day:"numeric",month:"long",year:"numeric"})}: <span className="text-accent">{days[selected]??0}</span> recorded completions.</p>
 </section>;
}
