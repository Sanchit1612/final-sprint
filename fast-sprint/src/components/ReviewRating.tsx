'use client';
import {useState,useTransition} from 'react';import {rateReview,stopReview} from '@/app/actions/preparation';import type {Rating} from '@/lib/revision/srs';
export function ReviewRating({itemId,canRemove=false}:{itemId:string;canRemove?:boolean}) {
 const [pending,start]=useTransition(),[message,setMessage]=useState('');
 return <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">How confident are you?</span>{(['again','hard','good','easy'] as Rating[]).map(r=><button key={r} disabled={pending} className="rounded-lg border border-line px-3 py-1.5 text-xs capitalize hover:border-accent" onClick={()=>start(async()=>{const result=await rateReview(itemId,r);setMessage(result.ok?'Review scheduled. Find it in your analytics revision queue.':result.error);})}>{r}</button>)}{canRemove&&<button className="text-xs text-muted hover:text-accent" disabled={pending} onClick={()=>start(async()=>{const r=await stopReview(itemId);setMessage(r.ok?"Review schedule removed.":r.error);})}>Stop scheduling</button>}</div>{message&&<p role="status" className="mt-1 text-xs text-muted">{message}</p>}</div>;
}
