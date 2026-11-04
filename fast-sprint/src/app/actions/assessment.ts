'use server';
import {z} from 'zod';import {revalidatePath} from 'next/cache';
import {requireSession} from '@/lib/session';import {billingAdmin} from '@/lib/billing/server';
import {assessmentsEnabled,selectQuestions,publicQuestions,subjects,type Question} from '@/lib/assessment/bank';
export async function startMock(input:unknown){
 const p=z.object({id:z.string().uuid(),subject:z.enum(subjects),count:z.union([z.literal(10),z.literal(15),z.literal(20)])}).strict().safeParse(input);
 if(!p.success)return {error:'Choose a subject and 10, 15 or 20 questions.'};
 const {user}=await requireSession();if(!assessmentsEnabled())return {error:'Scored mocks are currently unavailable.'};
 const {data,error}=await billingAdmin().rpc('start_quiz',{p_user:user.id,p_id:p.data.id,p_subject:p.data.subject,p_questions:selectQuestions(p.data.subject,p.data.count)});
 if(error)return {error:error.message.includes('daily_quiz_limit')?'Your Free mock is used for today. Review it below, or upgrade for unlimited mocks.':'Could not start the mock. Retry with the same selection.'};
 const row=Array.isArray(data)?data[0]:data;if(!row)return {error:"Could not load the saved attempt."};
 return {id:row.id,questions:publicQuestions(row.questions as Question[])};
}
export async function submitMock(id:string,answers:unknown){
 const p=z.array(z.number().int().min(0).max(3).nullable()).min(10).max(20).safeParse(answers);
 if(!z.string().uuid().safeParse(id).success||!p.success)return {error:'Invalid answers.'};
 const {user}=await requireSession();if(!assessmentsEnabled())return {error:'Mocks are not enabled.'};
 const {data,error}=await billingAdmin().rpc('submit_quiz',{p_user:user.id,p_id:id,p_answers:p.data});
 if(error)return {error:'Could not submit. Your attempt is saved; please retry.'};revalidatePath('/practice');
 const row=Array.isArray(data)?data[0]:data;if(!row)return {error:"Could not load the submitted result."};
 return {score:row.score as number,questions:row.questions as Question[],answers:row.answers as (number|null)[]};
}
export async function resumeMock(id:string){
 if(!z.string().uuid().safeParse(id).success)return {error:'Invalid attempt'};
 const {user}=await requireSession();if(!assessmentsEnabled())return {error:'Mocks are not enabled.'};
 const {data,error}=await billingAdmin().from('quiz_attempts').select('*').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(error||!data)return {error:'Attempt unavailable.'};
 return {id:data.id,questions:data.submitted_at?data.questions as Question[]:publicQuestions(data.questions as Question[]),answers:data.answers as (number|null)[]|null,score:data.score as number|null};
}
export async function setStudyDone(key:string,completed:boolean){
 const {studyKeys}=await import('@/lib/study');if(!studyKeys.has(key)||typeof completed!=='boolean')return {error:'Unknown learning item.'};
 const {supabase,user}=await requireSession();if(!assessmentsEnabled())return {error:'Checklist saving is currently unavailable.'};
 const {error}=await supabase.from('study_progress').upsert({user_id:user.id,item_key:key,completed},{onConflict:'user_id,item_key'});
 if(error)return {error:'Could not save progress.'};revalidatePath('/','layout');return {ok:true};
}
