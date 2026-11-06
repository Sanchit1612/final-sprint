'use client';
import Script from 'next/script';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {analyticsCommandQueue,analyticsPath,GOOGLE_ANALYTICS_ID} from '@/lib/site-analytics';
declare global{interface Window{dataLayer:unknown[];gtag?:(...args:unknown[])=>void}}
export function SiteAnalytics(){
 const pathname=usePathname(),[choice,setChoice]=useState<string|null>(null),[ready,setReady]=useState(false),last=useRef('');
 useEffect(()=>{try{setChoice(navigator.doNotTrack==='1'?'no':localStorage.getItem('fast-sprint:analytics'));}catch{setChoice('no');}},[]);
 useEffect(()=>{const path=analyticsPath(pathname);if(choice!=='yes'||!ready||!path||last.current===path)return;last.current=path;window.gtag?.('event','page_view',{send_to:GOOGLE_ANALYTICS_ID,page_location:window.location.origin+path,page_title:'Fast Sprint '+path,page_referrer:''});},[pathname,choice,ready]);
 useEffect(()=>{(window as unknown as Record<string,unknown>)['ga-disable-'+GOOGLE_ANALYTICS_ID]=choice!=='yes';},[choice]);
 function choose(value:string){try{localStorage.setItem('fast-sprint:analytics',value);}catch{}setChoice(value);}
 return <>{choice!==null&&<button className="fixed bottom-2 left-2 z-40 rounded-md bg-surface px-2 py-1 text-[10px] text-muted" onClick={()=>setChoice(null)}>Analytics privacy</button>}{choice==='yes'&&analyticsPath(pathname)&&<Script id="fast-sprint-ga" src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} strategy="afterInteractive" onReady={()=>{if(!window.gtag){window.dataLayer=window.dataLayer||[];window.gtag=analyticsCommandQueue(window.dataLayer);window.gtag('js',new Date());window.gtag('config',GOOGLE_ANALYTICS_ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:window.location.origin+(analyticsPath(pathname)??'/'),page_referrer:''});}setReady(true);}}/>}{choice===null&&<aside aria-label="Optional site analytics" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border border-line bg-surface p-4 shadow-xl"><p className="text-sm">Allow Google Analytics to measure site visits? Optional analytics helps improve Fast Sprint. We exclude personal notes, email addresses and authentication URLs.</p><div className="mt-3 flex gap-2"><button className="btn-primary !py-1.5" onClick={()=>choose('yes')}>Allow analytics</button><button className="btn-ghost !py-1.5" onClick={()=>choose('no')}>No thanks</button></div></aside>}</>;
}
