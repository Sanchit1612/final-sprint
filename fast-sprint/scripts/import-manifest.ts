/** Explicit, reviewed file-hash approval required. Dry-run is the default. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Client } from "pg";
import { planManifest, writeManifest } from "../src/lib/content/manifest";
async function main(){
 const args=process.argv.slice(2),file=args[0];
 if(!file)throw new Error('Usage: npm run content:manifest -- <file> [--apply --approved-sha256 <reviewed file hash>]');
 const bytes=readFileSync(file),hash=createHash('sha256').update(bytes).digest('hex'),manifest=JSON.parse(bytes.toString());
 const plan=planManifest(manifest);console.log(JSON.stringify({rows:plan.length,sha256:hash,dryRun:!args.includes('--apply')}));
 if(!args.includes('--apply'))return;
 if(args[args.indexOf('--approved-sha256')+1]!==hash||!args.includes('--approved-sha256'))throw new Error('Exact reviewed manifest hash approval required');
 // Do not load or print environment contents. Caller supplies credentials locally.
 const url=process.env.SUPABASE_DB_URL,ca=process.env.SUPABASE_DB_CA_FILE;
 if(!url||!ca)throw new Error('Set SUPABASE_DB_URL and SUPABASE_DB_CA_FILE locally');
 const parsed=new URL(url);if(['sslmode','sslcert','sslkey','sslrootcert'].some(k=>parsed.searchParams.has(k)))throw new Error('Remove connection-string SSL overrides; this script verifies using the explicit CA');
 const db=new Client({connectionString:url,ssl:{rejectUnauthorized:true,ca:readFileSync(ca,'utf8')},connectionTimeoutMillis:15000});
 try{await db.connect();const result=await writeManifest(db,manifest);console.log('Committed rows:',result.count);}finally{await db.end();}
}
main().catch(()=>{console.error('Manifest import failed. No credentials are printed. Review validation, approval hash and local connection settings.');process.exitCode=1;});
