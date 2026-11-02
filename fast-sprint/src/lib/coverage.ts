import type {SupabaseClient} from '@supabase/supabase-js';
import {fetchAll} from './tree';
/** Analytics needs counts, never full note bodies, bookmarks or resource URLs. */
export async function loadCoverage(db:SupabaseClient,user:string){
 const [rows,progress]=await Promise.all([fetchAll<{id:string;parent_id:string|null;root_id:string;title:string;slug:string;item_type:string;difficulty:string|null;position?:number}>((a,b)=>db.from('content_items').select('id,parent_id,root_id,title,slug,item_type,difficulty,position').neq('item_type','resource').order('id').range(a,b)),fetchAll<{item_id:string;status:string;needs_revision:boolean;updated_at?:string}>((a,b)=>db.from('user_item_progress').select('item_id,status,needs_revision,updated_at').eq('user_id',user).order('item_id').range(a,b))]);
 const done=new Set(progress.filter(p=>p.status==='done').map(p=>p.item_id));const revision=new Set(progress.filter(p=>p.needs_revision).map(p=>p.item_id));type Node={revision:number;id:string;title:string;total:number;completed:number;children:Node[]};
 const nodes=new Map<string,Node>(rows.map(r=>[r.id,{id:r.id,title:r.title,revision:0,total:0,completed:0,children:[]}]));
 for(const r of rows)if(r.parent_id)nodes.get(r.parent_id)?.children.push(nodes.get(r.id)!);
 const positions=new Map(rows.map(r=>[r.id,r.position??0]));for(const n of nodes.values())n.children.sort((a,b)=>positions.get(a.id)!-positions.get(b.id)!||a.title.localeCompare(b.title));
 function count(n:Node){if(!n.children.length){n.total=1;n.revision=revision.has(n.id)?1:0;n.completed=done.has(n.id)?1:0;}else{for(const c of n.children)count(c);n.revision=n.children.reduce((s,c)=>s+c.revision,0);n.total=n.children.reduce((s,c)=>s+c.total,0);n.completed=n.children.reduce((s,c)=>s+c.completed,0);}}
 return rows.filter(r=>!r.parent_id).map(root=>{const n=nodes.get(root.id)!;if(n.children.length)count(n);const ids=new Set(rows.filter(r=>r.root_id===root.id).map(r=>r.id));const lastActivity=progress.filter(p=>ids.has(p.item_id)&&p.updated_at).map(p=>p.updated_at!).sort().at(-1)??null;return {root,data:{lastActivity,total:n.total,completed:n.completed,tree:n.children,difficulty:["easy","medium","hard"].map(level=>{const selected=rows.filter(r=>r.root_id===root.id&&r.difficulty===level);return {level,total:selected.length,done:selected.filter(r=>done.has(r.id)).length};})}};});
}
