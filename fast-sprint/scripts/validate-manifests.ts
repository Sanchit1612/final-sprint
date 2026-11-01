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
 const parents=new Set(rows.filter(r=>r.item_type!=="resource").map(r=>r.parentPath));
 const leaves=rows.filter(r=>["topic","problem"].includes(r.item_type)&&!parents.has(r.path));
 const urls=new Map<string,number>();for(const r of rows)if(r.url)urls.set(r.url,(urls.get(r.url)??0)+1);
 const duplicatedResourceURLs=[...urls].filter(([,n])=>n>1);
 const resourceParents=new Set(rows.filter(r=>r.item_type==="resource").map(r=>r.parentPath));
 const report={file:name,sha256:createHash('sha256').update(bytes).digest('hex'),rows:rows.length,problems:problems.length,resources:rows.filter(r=>r.item_type==='resource').length,learningLeaves:leaves.length,leavesWithoutLinks:leaves.filter(r=>!r.url&&!resourceParents.has(r.path)).length,duplicateResourceURLCount:duplicatedResourceURLs.length,duplicateResourceURLs:rows[0].is_pro?'private-details-omitted':duplicatedResourceURLs.map(([url,count])=>({url,count})),tier:rows[0].is_pro?'Pro':'Free',missingProblemURLs:problems.filter(r=>!r.url).map(r=>r.path),pathsUnique:new Set(rows.map(r=>r.path)).size===rows.length,status:'structure-valid; not approval to publish'};
 reports.push(report);console.log(name,report.rows,'rows',report.problems,'problems',report.missingProblemURLs.length,'missing URLs');
 }catch(e){failed=true;reports.push({file:name,error:e instanceof Error?e.message:'Validation failed'});console.error(name,'INVALID');}
}
mkdirSync('verification',{recursive:true});writeFileSync('verification/nested-import-report.json',JSON.stringify({generatedAt:new Date().toISOString(),databaseWrites:0,reports},null,2)+'\n');
if(failed)process.exitCode=1;
