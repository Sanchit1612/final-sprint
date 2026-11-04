'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireSession} from '@/lib/session';
import {companyTrackingEnabled} from '@/lib/company-progress';
import {companySheet} from '@/lib/content/companies';
import {priorityProblems} from '@/lib/content/company-priority';
import {nextReview,type Rating} from '@/lib/revision/srs';
import type {Result} from '@/app/actions';
export async function saveCompanyProgress(company:string,problem:string,field:'completed'|'bookmarked',value:boolean):Promise<Result> {
 const {supabase,user,isPro}=await requireSession();
 if(!isPro||!companyTrackingEnabled())return {ok:false,error:'Company tracking is currently unavailable.'};
 if(!z.string().regex(/^[a-z0-9-]{1,200}$/).safeParse(problem).success||!['completed','bookmarked'].includes(field)||typeof value!=='boolean')return {ok:false,error:'Invalid progress.'};
 const sheet=companySheet(company);if(!sheet?.problems.some(p=>p.slug===problem)||field==='completed'&&!priorityProblems(sheet.problems).some(p=>p.slug===problem))return {ok:false,error:'Only priority questions count towards this checklist.'};
 const {error}=await supabase.from('company_problem_progress').upsert({user_id:user.id,company_slug:company,problem_slug:problem,[field]:value},{onConflict:'user_id,company_slug,problem_slug'});
 if(error)return {ok:false,error:'Could not save company progress. Please retry.'};
 revalidatePath('/companies','layout');return {ok:true};
}
export async function rateReview(itemId:string,rating:Rating):Promise<Result> {
 const {supabase,user,today}=await requireSession();
 if(!companyTrackingEnabled())return {ok:false,error:'Confidence reviews are currently unavailable.'};
 if(!z.string().uuid().safeParse(itemId).success||!['again','hard','good','easy'].includes(rating))return {ok:false,error:'Invalid review.'};
 const {data:content,error:contentError}=await supabase.from('content_items').select('id').eq('id',itemId).maybeSingle();
 if(contentError||!content)return {ok:false,error:'This learning item is unavailable.'};
 const {data:previous,error:readError}=await supabase.from('item_reviews').select('step').eq('user_id',user.id).eq('item_id',itemId).maybeSingle();
 if(readError)return {ok:false,error:'Could not load this review.'};
 const next=nextReview(previous?.step??0,rating,today);
 const {error}=await supabase.from('item_reviews').upsert({user_id:user.id,item_id:itemId,rating,step:next.step,due_date:next.dueDate,graduated:next.graduated},{onConflict:'user_id,item_id'});
 if(error)return {ok:false,error:'Could not save your review.'};
 revalidatePath('/','layout');return {ok:true};
}
export async function savePlannerWeek(input:unknown):Promise<Result> {
 const schema=z.array(z.object({title:z.string().trim().min(1).max(200),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),notes:z.string().max(500),itemId:z.string().uuid().nullable()})).min(1).max(42);
 const parsed=schema.safeParse(input);if(!parsed.success)return {ok:false,error:'Invalid weekly plan.'};
 const {supabase,user,today}=await requireSession();
 const {isISODate,addDays}=await import('@/lib/dates');
 if(parsed.data.some(t=>!isISODate(t.date)||t.date<today||t.date>addDays(today,6)))return {ok:false,error:'This preview has expired. Generate a new week.'};
 const itemIds=[...new Set(parsed.data.flatMap(t=>t.itemId?[t.itemId]:[]))];
 if(itemIds.length){const {data,error}=await supabase.from('content_items').select('id').in('id',itemIds);if(error||data?.length!==itemIds.length)return {ok:false,error:'Some learning items are no longer available. Generate a new preview.'};}
 const {error}=await supabase.from('daily_tasks').insert(parsed.data.map(t=>({user_id:user.id,title:t.title,task_date:t.date,notes:t.notes,item_id:t.itemId})));
 if(error)return {ok:false,error:error.message.includes('plan_limit:')?'This plan exceeds your daily task limit. Reduce the plan or move existing tasks first.':'Could not save the plan. Check Daily Sprint before retrying to avoid duplicate tasks.'};
 revalidatePath('/','layout');return {ok:true};
}
export async function editSprintTask(id:string,title:string,date:string):Promise<Result> {
 const {isISODate}=await import('@/lib/dates');
 if(!z.string().uuid().safeParse(id).success||typeof title!=='string'||!title.trim()||title.trim().length>200||!isISODate(date))return {ok:false,error:'Enter a task title and a valid date.'};
 const {supabase,user}=await requireSession();
 const {data,error}=await supabase.from('daily_tasks').update({title:title.trim(),task_date:date}).eq('id',id).eq('user_id',user.id).select('id').maybeSingle();
 if(error)return {ok:false,error:error.message.includes('plan_limit:')?'This day has reached your task limit. Choose another date.':'Could not update your task.'};
 if(!data)return {ok:false,error:'This task is unavailable.'};revalidatePath('/','layout');return {ok:true};
}
export async function redistributeSprintTasks():Promise<Result> {
 const {supabase,user,today}=await requireSession();const {fetchAll}=await import('@/lib/tree'),{addDays}=await import('@/lib/dates'),{redistributeMissed}=await import('@/lib/schedule/redistribute');
 const [missed,existing]=await Promise.all([fetchAll<{id:string;task_date:string}>((a,b)=>supabase.from('daily_tasks').select('id,task_date').eq('user_id',user.id).lt('task_date',today).eq('status','pending').order('task_date').order('id').range(a,b)),fetchAll<{task_date:string}>((a,b)=>supabase.from('daily_tasks').select('task_date').eq('user_id',user.id).gte('task_date',today).lte('task_date',addDays(today,6)).order('id').range(a,b))]);
 const loads:Record<string,number>={};for(const row of existing)loads[row.task_date]=(loads[row.task_date]??0)+1;
 const moves=redistributeMissed(missed.map(m=>m.id),today,loads);let moved=0;
 for(const move of moves){const {data,error}=await supabase.from('daily_tasks').update({task_date:move.date}).eq('id',move.id).eq('user_id',user.id).eq('status','pending').lt('task_date',today).select('id').maybeSingle();if(error||!data){revalidatePath('/','layout');return {ok:false,error:`Moved ${moved} tasks before a concurrent change or task limit stopped the operation. Review your sprint before retrying.`};}moved++;}
 revalidatePath('/','layout');if(moved<missed.length)return {ok:false,error:`Moved ${moved} tasks. ${missed.length-moved} remain because this week is full (up to 3 total tasks/day for redistribution). You can reschedule them manually.`};return {ok:true};
}
export async function stopReview(itemId:string):Promise<Result> {
 if(!z.string().uuid().safeParse(itemId).success)return {ok:false,error:'Invalid review.'};
 const {supabase,user}=await requireSession();if(!companyTrackingEnabled())return {ok:false,error:'Reviews are not enabled.'};
 const {error}=await supabase.from('item_reviews').delete().eq('user_id',user.id).eq('item_id',itemId);if(error)return {ok:false,error:'Could not remove the review schedule.'};revalidatePath('/','layout');return {ok:true};
}
