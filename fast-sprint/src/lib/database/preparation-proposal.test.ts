import {PGlite} from '@electric-sql/pglite';import {readFileSync} from 'node:fs';import {expect,it} from 'vitest';
it('proposal isolates both accounts, denies Free company writes and prevents reviews of inaccessible Pro content',async()=>{
 const db=new PGlite();try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated;`);
 for(const f of ['supabase/migrations/0001_v1_schema.sql','supabase/migrations/0002_quota_security.sql','supabase/proposals/preparation_tools.sql'])await db.exec(readFileSync(f,'utf8'));
 await db.exec('grant select on public.content_items,public.user_entitlements to authenticated');
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',item='33333333-3333-4333-8333-333333333333';
 await db.query("insert into auth.users values($1,'{}'),($2,'{}')",[a,b]);await db.query("select grant_pro($1,1)",[a]);await db.query("insert into content_items(id,item_type,path,slug,title,is_pro) values($1,'problem','fixture','fixture','Private',true)",[item]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.exec('set role authenticated');
 await db.query("insert into company_problem_progress(user_id,company_slug,problem_slug,completed) values($1,'google','two-sum',true)",[a]);await db.query("insert into item_reviews(user_id,item_id,rating,due_date) values($1,$2,'hard','2026-11-03')",[a,item]);
 await expect(db.query("insert into company_problem_progress(user_id,company_slug,problem_slug) values($1,'google','forged')",[b])).rejects.toThrow();
 await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);await db.exec('set role authenticated');expect((await db.query('select * from company_problem_progress')).rows).toHaveLength(0);expect((await db.query('select * from item_reviews')).rows).toHaveLength(0);
 await expect(db.query("insert into company_problem_progress(user_id,company_slug,problem_slug) values($1,'google','two-sum')",[b])).rejects.toThrow();await expect(db.query("insert into item_reviews(user_id,item_id,rating,due_date) values($1,$2,'easy','2026-11-03')",[b,item])).rejects.toThrow();
 await db.exec('reset role');await db.query("update user_entitlements set status='revoked' where user_id=$1",[a]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.exec('set role authenticated');expect((await db.query('select * from company_problem_progress')).rows).toHaveLength(1);expect((await db.query("update company_problem_progress set completed=false returning *")).rows).toHaveLength(0);
 }finally{await db.close();}
},30000);
