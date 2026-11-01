// Run only against the approved staging project: node --env-file=.env.local scripts/verify-staging-dsa.mjs
import fs from "node:fs";
import { Client } from "pg";
const env=process.env;
if(!env.SUPABASE_DB_URL)throw new Error("Set SUPABASE_DB_URL locally");
if(["sslmode","sslcert","sslkey","sslrootcert"].some(k=>new URL(env.SUPABASE_DB_URL).searchParams.has(k)))throw new Error("Remove URL SSL overrides; explicit CA verification is required");
import { randomUUID } from "node:crypto";
if(!process.argv.includes("--with-disposable-fixtures"))throw new Error("Explicit --with-disposable-fixtures required; this creates and removes temporary auth identities on staging");
const users=[randomUUID(),randomUUID()];
(async()=>{const db=new Client({connectionString:env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:true,ca:fs.readFileSync(env.SUPABASE_DB_CA_FILE || 'backups/prod-ca-2021.crt','utf8')},connectionTimeoutMillis:15000});let created=false;try{await db.connect();
const {rows}=await db.query("select r.path, c.item_type,count(*)::int as count,bool_and(not c.is_pro) as all_free,bool_and(c.root_id=r.id) as root_valid from content_items r join content_items c on c.root_id=r.id where r.path in ('dsa-200','dsa-neetcode150') group by r.path,c.item_type order by r.path,c.item_type");
const expected={'dsa-200':{subject:1,section:23,problem:200,resource:200},'dsa-neetcode150':{subject:1,section:18,problem:150,resource:150}};
if(rows.length!==8||rows.some(r=>expected[r.path][r.item_type]!==r.count||!r.all_free||!r.root_valid))throw Error('Counts or tier/root mismatch');
const item=(await db.query("select id from content_items where path='dsa-200/prefix-sum/0303-range-sum-query-immutable'")).rows[0].id;
for(const id of users)await db.query("insert into auth.users(id,aud,role,email,raw_user_meta_data) values ($1,'authenticated','authenticated',$2,'{}')",[id,'audit-'+id+'@example.invalid']);created=true;
const checks=[];
for(const id of users){await db.query('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);await db.query('set local role authenticated');for(const [root,n] of [['dsa-200',200],['dsa-neetcode150',150]]){const c=(await db.query("select count(*)::int n from content_items where item_type='problem' and path like $1",[root+'/%'])).rows[0].n;if(c!==n)throw Error('Free access mismatch');}await db.query("insert into user_item_progress(user_id,item_id,status) values($1,$2,'done')",[id,item]);await db.query("insert into user_notes(user_id,item_id,body) values($1,$2,'test fixture')",[id,item]);await db.query('insert into user_bookmarks(user_id,item_id) values($1,$2)',[id,item]);await db.query('commit');}catch(e){await db.query('rollback');throw e;}}
for(const id of users){await db.query('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);await db.query('set local role authenticated');for(const table of ['user_item_progress','user_notes','user_bookmarks']){const own=await db.query(`select * from ${table} where user_id=$1 and item_id=$2`,[id,item]);const foreign=await db.query(`select * from ${table} where user_id=$1 and item_id=$2`,[users.find(x=>x!==id),item]);if(own.rows.length!==1||foreign.rows.length)throw Error('Private learning data isolation failed');}checks.push('Free collection visibility and private learning data isolation passed');}finally{await db.query('rollback');}}
const report={verifiedAt:new Date().toISOString(),counts:rows,checks,scope:'staging only; SQL authenticated-role claims plus separate actual-browser persistence test',success:true};fs.writeFileSync('verification/staging-dsa-publication.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){console.log(JSON.stringify({error:e.code||e.message}));process.exitCode=1;}finally{if(created)for(const id of users)await db.query('delete from auth.users where id=$1',[id]);await db.end();}})();
