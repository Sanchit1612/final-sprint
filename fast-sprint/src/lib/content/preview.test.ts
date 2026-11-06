import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
const {load}=vi.hoisted(()=>({load:vi.fn().mockResolvedValue(null)}));
vi.mock('../tree',()=>({loadTree:load}));
import {loadLearningTree} from './preview';
it('serves complete Free DSA sheets to guests without querying private account tables',async()=>{
 load.mockClear();const data=await loadLearningTree({} as SupabaseClient,'','dsa-a2z');expect(data?.total).toBe(455);expect(data?.completed).toBe(0);expect(load).not.toHaveBeenCalled();
});
it('denies premium review content before querying or reading its data',async()=>{
 load.mockClear();await expect(loadLearningTree({} as SupabaseClient,'user','behavioural')).rejects.toThrow('Pro entitlement required');expect(load).not.toHaveBeenCalled();
});
it('renders actual Free source data with combined filters and stable pattern options',async()=>{
 const r=await loadLearningTree({} as SupabaseClient,'user','dsa-200',{q:'Two Sum',difficulty:'medium'});
 expect(r?.preview).toBe(true);expect(r?.total).toBe(200);expect(r?.patterns).toHaveLength(23);expect(r?.tree).toHaveLength(1);
 expect(r?.tree[0].children[0].title).toContain('Two Sum II');expect(r?.tree[0].children[0].resources[0].url).toBe('https://www.youtube.com/watch?v=cQ1Oz4ckceM');
});
it('loads a private pack only for an authorized Pro caller',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'fast-sprint-private-fixture-'));
 try{
 writeFileSync(join(dir,'behavioural.manifest.json'),JSON.stringify({version:1,root:{slug:'behavioural',title:'Private fixture',type:'subject',isPro:true,children:[{slug:'fixture',title:'Private test question',type:'topic'}]}}));
 await expect(loadLearningTree({} as SupabaseClient,'user','behavioural',{},false,dir)).rejects.toThrow('Pro entitlement required');
 const r=await loadLearningTree({} as SupabaseClient,'user','behavioural',{},true,dir);expect(r?.total).toBe(1);expect(r?.tree[0].title).toBe('Private test question');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('denies Development to Free accounts before any database read',async()=>{
 load.mockClear();await expect(loadLearningTree({} as SupabaseClient,'user','development')).rejects.toThrow('Pro entitlement required');expect(load).not.toHaveBeenCalled();
});
