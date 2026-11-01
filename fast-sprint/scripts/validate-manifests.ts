import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { planManifest } from "../src/lib/content/manifest";
const reports=[];
let failed=false;
for(const name of readdirSync("content/collections").filter(n=>n.endsWith(".manifest.json")).sort()){
 try{
 const bytes=readFileSync(join("content/collections",name));const rows=planManifest(JSON.parse(bytes.toString()));
 const problems=rows.filter(r=>r.item_type==="problem");
 const report={file:name,sha256:createHash('sha256').update(bytes).digest('hex'),rows:rows.length,problems:problems.length,resources:rows.filter(r=>r.item_type==='resource').length,missingProblemURLs:problems.filter(r=>!r.url).map(r=>r.path),pathsUnique:new Set(rows.map(r=>r.path)).size===rows.length,status:'structure-valid; not approval to publish'};
 reports.push(report);console.log(name,report.rows,'rows',report.problems,'problems',report.missingProblemURLs.length,'missing URLs');
 }catch(e){failed=true;reports.push({file:name,error:e instanceof Error?e.message:'Validation failed'});console.error(name,'INVALID');}
}
mkdirSync('verification',{recursive:true});writeFileSync('verification/nested-import-report.json',JSON.stringify({generatedAt:new Date().toISOString(),databaseWrites:0,reports},null,2)+'\n');
if(failed)process.exitCode=1;
