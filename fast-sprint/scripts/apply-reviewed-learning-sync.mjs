// Explicit approved staging proposal only; never a generic production migration runner.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Client} from 'pg';
const sha='129f9c3cbb2c7ab314843db5db9aa15a182ef3f284b9b657155cc237c3d4aed3',project='ufvjkvarzjgfxrerjlqp';
if(process.argv[2]!==`--approved-sha=${sha}`)throw Error('Exact explicit approval hash required');
const sql=fs.readFileSync('supabase/proposals/learning_sync.sql','utf8');if(createHash('sha256').update(sql).digest('hex')!==sha)throw Error('Proposal changed after approval');
const url=new URL(process.env.SUPABASE_DB_URL??'');
if(!decodeURIComponent(url.username).includes(project)&&url.hostname!==`db.${project}.supabase.co`)throw Error('Not the approved staging project');
if(['sslmode','sslcert','sslkey','sslrootcert'].some(k=>url.searchParams.has(k)))throw Error('SSL URL overrides denied');
const db=new Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(process.env.SUPABASE_DB_CA_FILE||'backups/prod-ca-2021.crt','utf8')},connectionTimeoutMillis:15000});
try{
 await db.connect();
 if((await db.query("select to_regclass('public.learning_item_state') existing")).rows[0].existing)throw Error('Preparation tables already exist; do not repeat proposal');
 const queries={tables:"select tablename,rowsecurity from pg_tables where schemaname='public'",columns:"select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public'",policies:"select * from pg_policies where schemaname='public'",functions:"select p.oid::regprocedure::text name,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'",triggers:"select tgname,pg_get_triggerdef(t.oid) definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal",constraints:"select c.relname table_name,con.conname,pg_get_constraintdef(con.oid) definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'",indexes:"select * from pg_indexes where schemaname='public'",grants:"select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public'"};
 const backup={preservedAt:new Date().toISOString(),scope:'public schema catalog, no user records',approvedProposalSHA256:sha};
 for(const [key,q] of Object.entries(queries))backup[key]=(await db.query(q)).rows;
 fs.writeFileSync('backups/staging-before-learning-sync.json',JSON.stringify(backup,null,2)+'\n');
 await db.query('begin');
 try {
 await db.query(sql);
 const names=['learning_item_state'];
 const tables=(await db.query("select tablename,rowsecurity from pg_tables where schemaname='public' and tablename=any($1) order by tablename",[names])).rows;
 const policies=(await db.query("select tablename,policyname,cmd from pg_policies where schemaname='public' and tablename=any($1)",[names])).rows;
 const triggers=(await db.query("select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relname=any($1) and not t.tgisinternal",[names])).rows;
 if(tables.length!==1||tables.some(t=>!t.rowsecurity)||policies.length!==4||triggers.length!==1)throw Error('Preparation schema verification mismatch');
 await db.query('commit');
 fs.writeFileSync('verification/staging-learning-sync-schema.json',JSON.stringify({appliedAt:new Date().toISOString(),proposalSHA256:sha,environment:'approved staging only',tables,policies,triggers,productionChanges:0,contentImports:0},null,2)+'\n');console.log(JSON.stringify({success:true,tables:tables.length,policies:policies.length,triggers:triggers.length}));
 }catch(e){await db.query('rollback');throw e;}
}catch(e){console.error(JSON.stringify({failed:true,code:e.code??null,message:(e.message??'').replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]')}));process.exitCode=1;}
finally{await db.end();}
