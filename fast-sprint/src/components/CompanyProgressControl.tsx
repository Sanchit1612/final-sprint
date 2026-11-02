'use client';
import {useEffect,useState,useTransition} from 'react';
import {saveCompanyProgress} from '@/app/actions/preparation';
export function CompanyProgressControl({company,problem,priority,completed,bookmarked,enabled}:{company:string;problem:string;priority:boolean;completed:boolean;bookmarked:boolean;enabled:boolean}) {
 const [pending,start]=useTransition(),[error,setError]=useState(''),[done,setDone]=useState(completed),[saved,setSaved]=useState(bookmarked);
 useEffect(()=>setDone(completed),[completed]);useEffect(()=>setSaved(bookmarked),[bookmarked]);
 const run=(field:'completed'|'bookmarked',value:boolean)=>{const update=field==='completed'?setDone:setSaved;update(value);start(async()=>{setError('');const r=await saveCompanyProgress(company,problem,field,value);if(!r.ok){update(!value);setError(r.error);}});};
 return <div className="flex flex-wrap items-center gap-3 text-xs">{priority&&<label className="flex items-center gap-2"><input aria-label={`Complete ${problem.replace(/-/g,' ')}`} type="checkbox" className="h-4 w-4 accent-blue-500" disabled={!enabled||pending} checked={done} onChange={e=>run('completed',e.target.checked)}/>Complete</label>}<button disabled={!enabled||pending} aria-pressed={saved} aria-label={`${saved?'Remove bookmark for':'Bookmark'} ${problem}`} className="text-accent disabled:opacity-40" onClick={()=>run('bookmarked',!saved)}>{saved?'★ Saved':'☆ Save'}</button>{error&&<span role="alert" className="text-danger">{error}</span>}</div>;
}
