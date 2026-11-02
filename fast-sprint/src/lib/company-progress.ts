import type {SupabaseClient} from '@supabase/supabase-js';
import {fetchAll} from './tree';
export const companyTrackingEnabled=()=>process.env.PREPARATION_TOOLS_ENABLED==='true';
export interface CompanyProgress {company_slug:string;problem_slug:string;completed:boolean;bookmarked:boolean}
export async function loadCompanyProgress(db:SupabaseClient,user:string,company?:string):Promise<CompanyProgress[]> {
 if(!companyTrackingEnabled())return [];
 return fetchAll<CompanyProgress>((a,b)=>{let q=db.from('company_problem_progress').select('company_slug,problem_slug,completed,bookmarked').eq('user_id',user);if(company)q=q.eq('company_slug',company);return q.order('company_slug').order('problem_slug').range(a,b);});
}
