import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
it('billing proposal settles once, isolates history, protects grants, and keeps test payments separate',async()=>{
 const db=new PGlite();
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema public,auth to authenticated,service_role;`);
  for(const f of ['supabase/migrations/0001_v1_schema.sql','supabase/migrations/0002_quota_security.sql','supabase/proposals/billing.sql'])await db.exec(readFileSync(f,'utf8'));
  await db.query("insert into auth.users values($1,'{}'),($2,'{}')",[a,b]);
  async function order(mode:string,provider:string){return (await db.query<{id:string}>("insert into payment_orders(user_id,request_id,provider_order_id,mode,months,amount,currency,status) values($1,gen_random_uuid(),$2,$3,1,8900,'INR','created') returning id",[a,provider,mode])).rows[0].id;}
  const test=await order('test','order_test');
  await db.query("select settle_payment($1,'pay_test','test_event','test',8900,'INR')",[test]);
  expect((await db.query<{plan:string}>('select plan from user_entitlements where user_id=$1',[a])).rows[0].plan).toBe('free');
  const live=await order('live','order_live');
  await expect(db.query("select settle_payment($1,'pay_live','bad_amount','live',1,'INR')",[live])).rejects.toThrow('invalid order');
  await expect(db.query("select settle_payment($1,'pay_live','bad_mode','test',8900,'INR')",[live])).rejects.toThrow('invalid order');
  await db.query("select settle_payment($1,'pay_live','live_event','live',8900,'INR')",[live]);
  const first=(await db.query<{expires_at:Date}>('select expires_at from user_entitlements where user_id=$1',[a])).rows[0].expires_at;
  await db.query("select settle_payment($1,'pay_live','duplicate_delivery','live',8900,'INR')",[live]);
  expect((await db.query<{expires_at:Date}>('select expires_at from user_entitlements where user_id=$1',[a])).rows[0].expires_at).toEqual(first);
  await expect(db.query("select settle_payment($1,'pay_other','other','live',8900,'INR')",[live])).rejects.toThrow('different payment');
  expect((await db.query('select * from payment_events')).rows).toHaveLength(2);
  await db.query("update user_entitlements set expires_at=null where user_id=$1",[a]);
  await db.query("select grant_pro($1,1)",[a]);
  expect((await db.query<{expires_at:Date|null}>('select expires_at from user_entitlements where user_id=$1',[a])).rows[0].expires_at).toBeNull();
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);await db.exec('set role authenticated');
  expect((await db.query('select * from payment_orders')).rows).toHaveLength(0);
  await expect(db.query("select settle_payment($1,'pay_live','forged','live',8900,'INR')",[live])).rejects.toThrow();
  await expect(db.exec("update payment_orders set status='paid'")).rejects.toThrow();
  await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.exec('set role authenticated');
  expect((await db.query('select * from payment_orders')).rows).toHaveLength(2);
 }finally{await db.close();}
},30000);
