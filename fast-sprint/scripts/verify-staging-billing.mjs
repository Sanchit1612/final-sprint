// Approved disposable SQL fixtures only. Does not claim real provider/JWT/browser acceptance.
import fs from 'node:fs';import {randomUUID} from 'node:crypto';import {Client} from 'pg';
if(!process.argv.includes('--with-disposable-fixtures'))throw Error('Explicit fixture flag required');
const ref='ufvjkvarzjgfxrerjlqp',uri=new URL(process.env.SUPABASE_DB_URL??'');if(!decodeURIComponent(uri.username).includes(ref)&&uri.hostname!==`db.${ref}.supabase.co`)throw Error('Wrong project');
if(['sslmode','sslcert','sslkey','sslrootcert'].some(k=>uri.searchParams.has(k)))throw Error('TLS overrides denied');
const options={connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(process.env.SUPABASE_DB_CA_FILE||'backups/prod-ca-2021.crt','utf8')},connectionTimeoutMillis:15000};
const db=new Client(options),users=[randomUUID(),randomUUID()],tag='FS'+Date.now(),orders=[],checks=[];
async function order(uid,suffix){const r=await db.query("insert into payment_orders(user_id,request_id,provider_order_id,mode,months,amount,currency,status) values($1,$2,$3,'test',1,8900,'INR','created') returning id",[uid,randomUUID(),'order_'+tag+suffix]);orders.push(r.rows[0].id);return r.rows[0].id;}
async function concurrent(o,payment,refunds){return Promise.all(refunds.map(async(refund,i)=>{const session=new Client(options);try{await session.connect();const pid=(await session.query('select pg_backend_pid() pid')).rows[0].pid;await session.query('set role service_role');await session.query("select process_payment($1,$2,$3,'test',8900,'INR',$4,null,null,0,true)",[o,payment,tag+':event:'+o+':'+refund+':'+i,refund]);return pid;}finally{await session.end();}}));}
async function role(uid,run){await db.query('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);await db.query('set local role authenticated');return await run();}finally{await db.query('rollback');}}
try{
 await db.connect();const env=(await db.query('select * from billing_environment')).rows[0];if(env.mode!=='test'||!env.allow_test_pro)throw Error('Staging test gate not approved/configured');
 for(const uid of users)await db.query("insert into auth.users(id,aud,role,email,raw_user_meta_data) values($1,'authenticated','authenticated',$2,'{}')",[uid,`billing-fixture-${uid}@example.invalid`]);
 const a=await order(users[0],'A'),b=await order(users[1],'B');
 const pids=await concurrent(a,'pay_'+tag+'A',Array(8).fill(0));if(new Set(pids).size!==8)throw Error('Sessions were not independent');
 let count=(await db.query('select count(*)::int n from billing_access_ledger where order_id=$1',[a])).rows[0].n;if(count!==1)throw Error('Duplicate access grants');checks.push('8 independent sessions: duplicate settlement produced one payment term');
 await concurrent(a,'pay_'+tag+'A',[8900,0,8900,0,8900,0,8900,0]);
 if((await db.query('select has_pro($1) pro',[users[0]])).rows[0].pro)throw Error('Refund race resurrected Pro');checks.push('8 independent sessions: capture/refund race ended refunded with no Pro');
 const c=await order(users[0],'C'),d=await order(users[0],'D');
 await Promise.all([concurrent(c,'pay_'+tag+'C',[0]),concurrent(d,'pay_'+tag+'D',[0])]);
 const duration=(await db.query("select expires_at>now()+interval '59 days' and expires_at<now()+interval '63 days' extended from user_entitlements where user_id=$1",[users[0]])).rows[0].extended;if(!duration)throw Error('Concurrent distinct renewals lost an extension');checks.push('Separate-session distinct orders extended both terms without a lost update');
 // Both accounts own a history row; all internal billing data and writes remain hidden.
 for(const uid of users){
  const foreign=users.find(x=>x!==uid);
  await role(uid,async()=>{const own=(await db.query('select id from payment_orders where user_id=$1',[uid])).rows,other=(await db.query('select id from payment_orders where user_id=$1',[foreign])).rows;if(!own.length||other.length)throw Error('History isolation failed');});
  for(const table of ['billing_environment','payment_events','payment_disputes','billing_access_ledger']){
   let denied=false;try{await role(uid,()=>db.query(`select * from ${table}`));}catch(e){denied=e.code==='42501';}if(!denied)throw Error('Internal table exposed');
  }
  let denied=false;try{await role(uid,()=>db.query("select grant_pro($1,1)",[uid]));}catch(e){denied=e.code==='42501';}if(!denied)throw Error('Self grant permitted');
  denied=false;try{await role(uid,()=>db.query("select process_payment($1,$2,'forged','test',8900,'INR',0,null,null,0,true)",[b,'pay_'+tag+'B']));}catch(e){denied=e.code==='42501';}if(!denied)throw Error('Self settlement permitted');
  denied=false;try{await role(uid,()=>db.query("insert into payment_orders(user_id,request_id,mode,months,amount,currency) values($1,$2,'test',1,8900,'INR')",[uid,randomUUID()]));}catch(e){denied=e.code==='42501';}if(!denied)throw Error('Forged order permitted');
 }
 checks.push('Both accounts: own history only; internal reads, forged orders, self-settlement and self-grants denied');
 fs.writeFileSync('verification/staging-billing-acceptance.json',JSON.stringify({testedAt:new Date().toISOString(),success:true,scope:'approved staging SQL roles/claims; not issued-JWT or provider browser acceptance',checks,independentSessions:8,productionChanges:0},null,2)+'\n');console.log(JSON.stringify({success:true,checks}));
}catch(e){console.error(JSON.stringify({failed:true,code:e.code??null,message:e.message}));process.exitCode=1;}
finally{
 // Remove only this run's generated fixtures, in FK-safe order. Preserve all actual account/content rows.
 try{for(const uid of users){await db.query('delete from billing_access_ledger where user_id=$1',[uid]);await db.query('delete from payment_disputes where order_id in(select id from payment_orders where user_id=$1)',[uid]);await db.query('delete from payment_events where order_id in(select id from payment_orders where user_id=$1)',[uid]);await db.query('delete from payment_orders where user_id=$1',[uid]);await db.query('delete from auth.users where id=$1',[uid]);}console.log('Disposable billing fixtures removed');}finally{await db.end();}
}
