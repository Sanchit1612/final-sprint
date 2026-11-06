import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
const db=new PGlite(),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',item='33333333-3333-4333-8333-333333333333';
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;`);
 for(const path of ['supabase/migrations/0001_v1_schema.sql','supabase/migrations/0002_quota_security.sql','supabase/proposals/learning_sync.sql'])await db.exec(readFileSync(path,'utf8'));
 await db.exec(`insert into auth.users values('${a}','{}'),('${b}','{}');`);
},30000);
afterAll(async()=>{await db.close();});
it('isolates private learning state, denies forged ownership and protects Pro writes',async()=>{
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${a}';insert into public.learning_item_state(user_id,root_slug,item_id,note,done) values('${a}','os','${item}','private note',true);`);
 await expect(db.exec(`insert into public.learning_item_state(user_id,root_slug,item_id) values('${b}','os','${item}');`)).rejects.toThrow();
 await expect(db.exec(`insert into public.learning_item_state(user_id,root_slug,item_id) values('${a}','aptitude','${item}');`)).rejects.toThrow();
 await db.exec(`set request.jwt.claim.sub='${b}';`);expect((await db.query('select * from public.learning_item_state')).rows).toHaveLength(0);
 await db.exec(`update public.learning_item_state set note='forged';delete from public.learning_item_state;reset role;`);
 expect((await db.query<{note:string}>('select note from public.learning_item_state')).rows[0].note).toBe('private note');
 await db.exec(`update public.user_entitlements set plan='pro',status='active',expires_at=now()+interval '1 day' where user_id='${a}';set role authenticated;set request.jwt.claim.sub='${a}';insert into public.learning_item_state(user_id,root_slug,item_id,note) values('${a}','aptitude','${item}','own pro note');reset role;update public.user_entitlements set expires_at=now()-interval '1 day' where user_id='${a}';set role authenticated;set request.jwt.claim.sub='${a}';`);
 expect((await db.query("update public.learning_item_state set note='changed' where root_slug='aptitude' returning item_id")).rows).toHaveLength(0);
 await expect(db.exec(`update public.learning_item_state set note=repeat('a',5001) where root_slug='os';`)).rejects.toThrow();
 await db.exec('reset role;set role anon;');await expect(db.query('select * from public.learning_item_state')).rejects.toThrow();await db.exec('reset role;');
});
