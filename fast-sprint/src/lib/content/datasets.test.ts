import { expect,it } from "vitest";
import { readFileSync,readdirSync } from "node:fs";
import { planManifest } from "./manifest";
it("validates every prepared nested collection without database writes",()=>{
 for(const file of readdirSync('content/collections').filter(n=>n.endsWith('.manifest.json'))){
  const rows=planManifest(JSON.parse(readFileSync('content/collections/'+file,'utf8')));
  expect(new Set(rows.map(r=>r.path)).size).toBe(rows.length);
 }
});
it("contains actual 200/150 records with unique problems and publisher-backed videos",()=>{
 for(const [key,count] of [['dsa-200',200],['dsa-neetcode150',150]] as const){
  const d=JSON.parse(readFileSync(`content/collections/${key}.json`,'utf8'));
  expect(d.problems).toHaveLength(count);
  expect(new Set(d.problems.map((p:{url:string})=>p.url)).size).toBe(count);
  for(const p of d.problems){
   expect(p.source).toContain('8fed5f7daa6a517e375a0562d876e4a72dfdafb8');
   expect(p.url).toMatch(/^https:\/\/leetcode.com\/problems\/[a-z0-9-]+\/$/);
   expect(['easy','medium','hard']).toContain(p.difficulty);
   expect(p.verification.videoHTTP.state).toBe('reachable-oembed');
   expect(['NeetCode','NeetCodeIO']).toContain(p.verification.videoHTTP.author);
   expect(p.verification.problemHTTP.state).toBe('inconclusive-blocked');
  }
 }
});
it("retains all 18 source steps and 455 ordered A2Z positions including unresolved entries",()=>{
 const d=JSON.parse(readFileSync('content/collections/dsa-a2z.manifest.json','utf8'));expect(d.root.children).toHaveLength(18);
 const items=d.root.children.flatMap((n:{children:unknown[]})=>n.children);expect(items).toHaveLength(455);
 expect(items.map((n:{meta:{originalNumber:number}})=>n.meta.originalNumber)).toEqual(Array.from({length:455},(_,i)=>i+1));
 expect(items.filter((n:{url?:string})=>!n.url)).toHaveLength(0);
 const original=JSON.parse(readFileSync('content/sources/a2z-original-identities.json','utf8'));
 expect(d.root.children.flatMap((g:{slug:string;children:{slug:string;title:string;meta:{originalNumber:number}}[]})=>g.children.map(n=>({sectionSlug:g.slug,slug:n.slug,title:n.title,number:n.meta.originalNumber})))).toEqual(original);
 // Prevent two previously risky semantic conflations from resurfacing.
 expect(items[385].url).not.toContain('leetcode.com/problems/frog-jump');
 expect(items[434].url).toContain('boolean-parenthesization');
});
