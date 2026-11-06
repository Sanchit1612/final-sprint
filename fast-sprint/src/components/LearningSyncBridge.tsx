'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {importBrowserLearning} from '@/app/actions/learning';
import {localLearningPrefix,readLocalLearningItem,type LocalLearningItem} from '@/lib/local-learning';
type Entry=LocalLearningItem&{id:string};
export function LearningSyncBridge({user,tools=false}:{user:string;tools?:boolean}){
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),router=useRouter();
 async function transfer(items:Entry[]){
  if(items.length>5000)throw Error('Backup contains too many entries.');
  let count=0;for(let i=0;i<items.length;i+=30){const batch=items.slice(i,i+30),result=await importBrowserLearning(batch);for(const id of result.accepted){localStorage.setItem(`fast-sprint:synced:${user}:${id}`,'true');count++;}if(!result.ok)throw Error(result.error);}
  setMessage(`${count} entries synced. Existing account saves were preserved.${count<items.length?' Some entries need access to their collection before they can sync.':''}`);if(count)router.refresh();
 }
 function localEntries(){const prefix=localLearningPrefix(user);return Object.keys(localStorage).filter(k=>k.startsWith(prefix)).flatMap(k=>{try{const item=readLocalLearningItem(k);return item?[{...item,id:k.slice(prefix.length)}]:[];}catch{return [];}});}
 useEffect(()=>{
  if(tools)return;let alive=true;
  async function migrate(){try{const items=localEntries().filter(i=>!localStorage.getItem(`fast-sprint:synced:${user}:${i.id}`));if(!items.length)return;setBusy(true);await transfer(items);}catch(e){if(alive)setMessage(e instanceof Error?e.message:'Sync failed. Browser copies are retained.');}finally{if(alive)setBusy(false);}}
  void migrate();return()=>{alive=false;};
  // Run once per signed-in account; acknowledged records remain as local backups.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user,tools]);
 if(!tools)return message||busy?<p role="status" className="fixed bottom-3 right-3 z-40 max-w-sm rounded-xl border border-line bg-surface p-3 text-xs">{busy?'Syncing your browser saves to your account…':message}</p>:null;
 return <section className="card mt-5"><h2 className="text-xl">Move your saved work safely</h2><p className="my-3 text-sm text-muted">Account saves follow the same sign-in across devices. If you used another site address, export your browser backup there and import it here. Existing account entries win when a backup overlaps. Notes are personal: keep the exported file private.</p><button className="btn-ghost" disabled={busy} onClick={()=>{try{const blob=new Blob([JSON.stringify({version:1,user,items:localEntries()})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fast-sprint-learning-backup.json';a.click();URL.revokeObjectURL(url);}catch{setMessage('Could not export your browser backup.');}}}>Export browser backup</button><label className="btn-ghost ml-2 cursor-pointer">Import backup<input type="file" className="sr-only" accept="application/json,.json" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);try{if(file.size>4*1024*1024)throw Error('Backup is too large.');const data=JSON.parse(await file.text());if(data.version!==1||data.user!==user||!Array.isArray(data.items))throw Error('Use a backup from this same Fast Sprint account.');await transfer(data.items);}catch(err){setMessage(err instanceof Error?err.message:'Could not import backup.');}finally{setBusy(false);}}}/></label>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</section>;
}
