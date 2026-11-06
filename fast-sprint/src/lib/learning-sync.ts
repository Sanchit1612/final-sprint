import type {SupabaseClient} from '@supabase/supabase-js';
import {fetchAll} from './tree';
export const learningSyncEnabled=()=>process.env.LEARNING_SYNC_ENABLED==='true';
export interface LearningState {root_slug:string;item_id:string;done:boolean;revise:boolean;bookmarked:boolean;note:string;updated_at:string}
export async function learningStates(db:SupabaseClient,user:string,root?:string):Promise<LearningState[]>{
 if(!learningSyncEnabled()||!user)return [];
 return fetchAll<LearningState>((a,b)=>{let q=db.from('learning_item_state').select('root_slug,item_id,done,revise,bookmarked,note,updated_at').eq('user_id',user);if(root)q=q.eq('root_slug',root);return q.order('root_slug').order('item_id').range(a,b);});
}
