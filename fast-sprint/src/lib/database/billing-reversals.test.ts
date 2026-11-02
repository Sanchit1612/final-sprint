import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
it('supports staging Pro, refunds, dispute ordering and preserves unrelated manual access atomically',async()=>{
 const db=new PGlite(),user='11111111-1111-4111-8111-111111111111';let sequence=0;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,service_role;`);
  for(const f of ['supabase/migrations/0001_v1_schema.sql','supabase/migrations/0002_quota_security.sql','supabase/proposals/billing.sql'])await db.exec(readFileSync(f,'utf8'));
  await db.query("insert into auth.users values($1,'{}')",[user]);
  const entitlement=async()=>(await db.query<{plan:string;expires_at:Date|null}>('select plan,expires_at from user_entitlements where user_id=$1',[user])).rows[0];
  async function order(){sequence++;return (await db.query<{id:string}>("insert into payment_orders(user_id,request_id,provider_order_id,mode,months,amount,currency,status) values($1,gen_random_uuid(),$2,'test',1,8900,'INR','created') returning id",[user,'order_'+sequence])).rows[0].id;}
  async function settle(id:string,payment:string,refunded=0,event='capture'+sequence){await db.query("select process_payment($1,$2,$3,'test',8900,'INR',$4,null,null,0,true)",[id,payment,event,refunded]);}
  const a=await order();await expect(settle(a,'pay_a')).rejects.toThrow('invalid order');
  await db.exec('update billing_environment set allow_test_pro=true');
  await settle(a,'pay_a');const first=await entitlement();expect(first.plan).toBe('pro');
  await settle(a,'pay_a');expect(await entitlement()).toEqual(first);
  await db.query("select reconcile_payment($1,'pay_a','partial',1000)",[a]);expect(await entitlement()).toEqual(first);
  await db.query("select reconcile_payment($1,'pay_a','full',8900)",[a]);expect((await entitlement()).plan).toBe('free');
  // A stale capture/partial refund cannot reset a full refund or resurrect its term.
  await settle(a,'pay_a',0,'latecapture');expect((await entitlement()).plan).toBe('free');
  const b=await order();await settle(b,'pay_b');const beforeDispute=await entitlement();
  await db.query("select reconcile_payment($1,'pay_b','disputed',0,'disp_b','open',100)",[b]);expect((await entitlement()).plan).toBe('free');
  await db.query("select reconcile_payment($1,'pay_b','won',0,'disp_b','won',200)",[b]);expect(await entitlement()).toEqual(beforeDispute);
  await db.query("select reconcile_payment($1,'pay_b','oldopen',0,'disp_b','open',50)",[b]);expect(await entitlement()).toEqual(beforeDispute);
  await db.query("select reconcile_payment($1,'pay_b','fullb',8900)",[b]);
  await db.query("select grant_pro($1,3,'manual','fixture')",[user]);const manual=await entitlement();
  const c=await order();await settle(c,'pay_c');expect((await entitlement()).expires_at).not.toEqual(manual.expires_at);
  await db.query("select reconcile_payment($1,'pay_c','fullc',8900)",[c]);expect(await entitlement()).toEqual(manual);
  // A refund arriving before capture never leaves Pro granted after commit.
  const d=await order();await settle(d,'pay_d',8900);expect(await entitlement()).toEqual(manual);
  await db.query('select revoke_test_access($1)',[user]);expect(await entitlement()).toEqual(manual);
  expect((await db.query('select * from payment_orders where paid_at is not null')).rows).toHaveLength(4);
  await db.exec('set role authenticated');
  for(const table of ['billing_environment','payment_events','payment_disputes','billing_access_ledger'])await expect(db.query('select * from '+table)).rejects.toThrow();
  await expect(db.query('select revoke_test_access($1)',[user])).rejects.toThrow();
 }finally{await db.close();}
},30000);
