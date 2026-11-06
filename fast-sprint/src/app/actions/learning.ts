'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireSession} from '@/lib/session';
import {learningSyncEnabled} from '@/lib/learning-sync';
import {manifestLeaves} from '@/lib/content/files';
import {DSA_COLLECTIONS} from '@/config/dsa';
const changeSchema=z.object({root:z.string(),id:z.string().uuid(),field:z.enum(['done','revise','marked','note']),value:z.union([z.boolean(),z.string().max(5000)])}).refine(c=>c.field==='note'?typeof c.value==='string':typeof c.value==='boolean');
export async function saveManifestState(input:unknown){
 const parsed=changeSchema.safeParse(input);if(!parsed.success)return {ok:false,error:'Invalid learning update.'};
 const {supabase,user,isPro}=await requireSession();if(!learningSyncEnabled())return {ok:false,error:'Account sync is not enabled.'};
 const c=parsed.data;
 try{if(!manifestLeaves(c.root,isPro).some(r=>r.id===c.id))return {ok:false,error:'Learning item unavailable.'};}catch{return {ok:false,error:'Collection unavailable or access restricted.'};}
 const {error}=await supabase.from('learning_item_state').upsert({user_id:user.id,root_slug:c.root,item_id:c.id,[c.field==='marked'?'bookmarked':c.field]:c.value},{onConflict:'user_id,root_slug,item_id'});
 if(error)return {ok:false,error:'Could not save your learning update. Please retry.'};revalidatePath('/','layout');return {ok:true};
}
const legacySchema=z.array(z.object({id:z.string().uuid(),href:z.string().max(500),done:z.boolean(),revise:z.boolean(),marked:z.boolean(),note:z.string().max(5000)})).max(30);
export async function importBrowserLearning(input:unknown){
 const parsed=legacySchema.safeParse(input);if(!parsed.success)return {ok:false,accepted:[] as string[],error:'Invalid browser backup.'};
 const {supabase,user,isPro}=await requireSession();if(!learningSyncEnabled())return {ok:false,accepted:[] as string[],error:'Account sync is not enabled.'};
 const accepted:string[]=[];
 for(const item of parsed.data){
  let root:string|undefined;
  try{const url=new URL(item.href,'https://fastsprintprep.netlify.app');if(url.origin!=='https://fastsprintprep.netlify.app')continue;
   root=url.pathname==='/dsa'?DSA_COLLECTIONS.find(c=>c.key===url.searchParams.get('collection'))?.root:url.pathname.match(/^\/(?:core|resources)\/([a-z-]+)$/)?.[1];
   if(!root||!manifestLeaves(root,isPro).some(r=>r.id===item.id))continue;
  }catch{continue;}
  const {error}=await supabase.from('learning_item_state').upsert({user_id:user.id,root_slug:root,item_id:item.id,done:item.done,revise:item.revise,bookmarked:item.marked,note:item.note},{onConflict:'user_id,root_slug,item_id',ignoreDuplicates:true});
  if(error)return {ok:false,accepted,error:'Some saves could not sync. Your browser copy is retained.'};accepted.push(item.id);
 }
 revalidatePath('/','layout');return {ok:true,accepted};
}
