// Explicit approved staging proposal only; never a generic production migration runner.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Client} from 'pg';
const sha='366b776dad719191611e165d854e3fb32871087af76a68a6e9202e3a050ea372',project='ufvjkvarzjgfxrerjlqp';
if(process.argv[2]!==`--approved-sha=${sha}`)throw Error('Exact explicit approval hash required');
const sql=fs.readFileSync('supabase/proposals/billing.sql','utf8');if(createHash('sha256').update(sql).digest('hex')!==sha)throw Error('Proposal changed after approval');
const url=new URL(process.env.SUPABASE_DB_URL??'');
if(!decodeURIComponent(url.username).includes(project)&&url.hostname!==`db.${project}.supabase.co`)throw Error('Not the approved staging project');
if(['sslmode','sslcert','sslkey','sslrootcert'].some(k=>url.searchParams.has(k)))throw Error('SSL URL overrides denied');
const db=new Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(process.env.SUPABASE_DB_CA_FILE||'backups/prod-ca-2021.crt','utf8')},connectionTimeoutMillis:15000});
try{
 await db.connect();
 if((await db.query("select to_regclass('public.payment_orders') existing")).rows[0].existing)throw Error('Billing tables already exist; do not repeat proposal');
 const queries={tables:"select tablename,rowsecurity from pg_tables where schemaname='public'",columns:"select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public'",policies:"select * from pg_policies where schemaname='public'",functions:"select p.oid::regprocedure::text name,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'",triggers:"select tgname,pg_get_triggerdef(t.oid) definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal",constraints:"select c.relname table_name,con.conname,pg_get_constraintdef(con.oid) definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'",indexes:"select * from pg_indexes where schemaname='public'",grants:"select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public'"};
 const backup={preservedAt:new Date().toISOString(),scope:'public schema catalog, no user records',approvedProposalSHA256:sha};
 for(const [key,q] of Object.entries(queries))backup[key]=(await db.query(q)).rows;
 fs.writeFileSync('backups/staging-before-reviewed-billing.json',JSON.stringify(backup,null,2)+'\n');
 await db.query(sql);
 await db.query("update public.billing_environment set allow_test_pro=true where singleton and mode='test'");
 const tables=(await db.query("select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('billing_environment','payment_orders','payment_events','payment_disputes','billing_access_ledger') order by tablename")).rows;
 if(tables.length!==5||tables.some(t=>!t.rowsecurity))throw Error('RLS catalog mismatch');
 const funcs=(await db.query("select p.proname,has_function_privilege('authenticated',p.oid,'EXECUTE') client_execute,has_function_privilege('anon',p.oid,'EXECUTE') anon_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('settle_payment','process_payment','reconcile_payment','record_payment_attempt','revoke_test_access','billing_recompute','billing_capture_baseline','limit_checkout_orders','grant_pro')")).rows;
 if(funcs.some(f=>f.client_execute||f.anon_execute))throw Error('Unsafe function grant');
 const report={appliedAt:new Date().toISOString(),environment:'approved staging only',proposalSHA256:sha,tables,functions:funcs,testMode:true,stagingTestProGate:true,productionChanges:0,contentChanges:0};
 fs.writeFileSync('verification/staging-billing-schema.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({success:true,tables:tables.length,protectedFunctions:funcs.length,testProGate:true}));
}catch(e){console.error(JSON.stringify({failed:true,code:e.code??null,message:(e.message??'').replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]')}));process.exitCode=1;}
finally{await db.end();}
