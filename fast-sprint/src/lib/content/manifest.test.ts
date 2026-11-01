import { expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { planManifest, writeManifest, type ContentNode } from "./manifest";
const root: ContentNode = {slug:"fixture",title:"Fixture",type:"subject",children:[{slug:"group",title:"Group",type:"section",children:[{slug:"topic",title:"Topic",type:"topic",children:[{slug:"problem",title:"Problem",type:"problem",url:"https://example.com/problem",children:[{slug:"video",title:"Video",type:"resource",url:"https://youtube.com/watch?v=example"}]}]}]}]};
it("rejects unsafe URLs, duplicate paths and duplicate canonical problems", () => {
  expect(()=>planManifest({version:1,root:{...root,url:"javascript:alert(1)"}})).toThrow();
  expect(()=>planManifest({version:1,root:{...root,children:[root.children![0],root.children![0]]}})).toThrow("Duplicate path");
  expect(()=>planManifest({version:1,root:{...root,children:[{slug:"a",title:"A",type:"problem",url:"https://example.com/p"},{slug:"b",title:"B",type:"problem",url:"https://example.com/p/"}]}})).toThrow("Duplicate problem URL");
});
it("propagates premium flags and rejects premium basic collections",()=>{
  expect(planManifest({version:1,root:{...root,isPro:true}}).every(r=>r.is_pro)).toBe(true);
  expect(()=>planManifest({version:1,root:{...root,slug:"development",isPro:false}})).toThrow("must declare Pro");
  expect(()=>planManifest({version:1,root:{...root,slug:"dsa-200",isPro:true}})).toThrow("must be Free");
});
it("imports nested content atomically, preserves IDs and rolls back failures",async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
 await db.exec(readFileSync('supabase/migrations/0001_v1_schema.sql','utf8'));
 const adapter={query:async(sql:string,values?:unknown[])=>{if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};return db.query<Record<string,unknown>>(sql,values);}};
 await db.exec("insert into content_items(id,item_type,path,slug,title) values ('33333333-3333-4333-8333-333333333333','subject','fixture','fixture','Existing root')");
 const manifest={version:1,root};const first=await writeManifest(adapter,manifest),second=await writeManifest(adapter,manifest);
 expect(second).toEqual(first);expect(first.count).toBe(5);expect(first.ids.fixture).toBe('33333333-3333-4333-8333-333333333333');
 const failAdapter={query:async(sql:string,values?:unknown[])=>{if(values?.includes('fixture/group/topic/problem'))throw Error('simulated write failure');return adapter.query(sql,values);}};
 await expect(writeManifest(failAdapter,{version:1,root:{...root,title:'Changed'}})).rejects.toThrow('simulated');
 expect((await db.query<{title:string}>("select title from content_items where path='fixture'")).rows[0].title).toBe('Fixture');
 }finally{await db.close();}
},30000);
it('secures retained descendants when a collection becomes Pro without deleting records',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql as $$select null::uuid$$;`);
  await db.exec(readFileSync('supabase/migrations/0001_v1_schema.sql','utf8'));
  await db.exec("insert into content_items(item_type,path,slug,title,is_pro) values('topic','development/retained','retained','Retained topic',false)");
  const adapter={query:async(sql:string,values?:unknown[])=>sql.includes('pg_advisory_xact_lock')?{rows:[]}:db.query<Record<string,unknown>>(sql,values)};
  await writeManifest(adapter,{version:1,root:{slug:'development',title:'Development',type:'subject',isPro:true,children:[]}});
  const row=(await db.query<{is_pro:boolean}>("select is_pro from content_items where path='development/retained'")).rows;
  expect(row).toHaveLength(1);expect(row[0].is_pro).toBe(true);
 }finally{await db.close();}
},30000);
