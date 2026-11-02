"use client";
import {useId,useState} from 'react';
import {checkPractice,type PracticeData} from '@/lib/content/practice';
/** Delivered only through the server-authorised learning tree. No claim of exam/analytics persistence. */
export function PracticeExercise({data}:{data:PracticeData}){
 const id=useId(),[response,setResponse]=useState(''),[revealed,setRevealed]=useState(false);
 return <div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm">
  <p className="whitespace-pre-line leading-relaxed">{data.question}</p>
  {data.assumption&&<p className="mt-3 text-xs text-warn">{data.assumption}</p>}
  {data.options.length?<fieldset className="mt-4 space-y-2"><legend className="mb-2 text-xs text-muted">Choose your answer</legend>{data.options.map(o=><label key={o.id} className="flex cursor-pointer gap-3 rounded-lg border border-line px-3 py-2"><input type="radio" name={id} value={o.id} checked={response===o.id} disabled={revealed} onChange={()=>setResponse(o.id)} className="accent-accent"/><span>{o.id.toUpperCase()}. {o.text}</span></label>)}</fieldset>:<div className="mt-4"><label htmlFor={id} className="label">Your answer</label><input id={id} className="input" value={response} disabled={revealed} onChange={e=>setResponse(e.target.value)}/></div>}
  <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!response.trim()||revealed} className="btn-primary !py-2" onClick={()=>setRevealed(true)}>Check answer</button>{revealed&&<button type="button" className="btn-ghost !py-2" onClick={()=>{setRevealed(false);setResponse('');}}>Try again</button>}</div>
  {revealed&&<div role="status" className="mt-4 space-y-2"><p className={checkPractice(data,response)?'text-success':'text-warn'}>{checkPractice(data,response)?'Correct — keep the reasoning in mind.':'Review the approach and try it again.'}</p><p className="font-semibold">Answer: {data.answer}</p><p className="text-muted">{data.explanation}</p></div>}
  <p className="mt-4 text-xs text-muted">{data.sourceLabel}. Practice answers are for this page session; they are not recorded as accuracy or readiness scores.</p>
 </div>;
}
