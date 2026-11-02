import {existsSync,readFileSync} from 'node:fs';import {expect,it} from 'vitest';import {companyIndex,companySheet} from './companies';
it('rejects unknown company paths and validates private sheets against official access evidence when available',()=>{
 expect(companySheet('../.env.local')).toBeNull();const index=companyIndex();if(!index.length)return;
 expect(index).toHaveLength(50);const proofPath='backups/company-review/leetcode-access.json';const proof=existsSync(proofPath)?new Map(JSON.parse(readFileSync(proofPath,'utf8')).map((r:{titleSlug:string;isPaidOnly:boolean})=>[r.titleSlug,r.isPaidOnly])):null;
 for(const c of index){const sheet=companySheet(c.slug)!;expect(sheet.count).toBe(c.count);expect(sheet.problems).toHaveLength(c.count);expect(new Set(sheet.problems.map(p=>p.slug)).size).toBe(c.count);for(const p of sheet.problems){expect(p.paidOnly).toBe(false);expect(p.topics?.length).toBeGreaterThan(0);expect(p.url).toBe(`https://leetcode.com/problems/${p.slug}/`);if(proof)expect(proof.get(p.slug)).toBe(false);}expect(sheet.problems.every((p,i,a)=>i===0||a[i-1].frequency>=p.frequency)).toBe(true);}
});
it('company analytics ignore additional completions and count valid bookmarks separately',async()=>{
 const {priorityProblems}=await import('./company-priority'),{companySummaries}=await import('./company-summary');const c=companyIndex().find(c=>c.count>200);if(!c)return;const sheet=companySheet(c.slug)!,priority=priorityProblems(sheet.problems),ids=new Set(priority.map(p=>p.slug)),extra=sheet.problems.find(p=>!ids.has(p.slug))!;
 const summaries=companySummaries([{company_slug:c.slug,problem_slug:extra.slug,completed:true,bookmarked:true},{company_slug:c.slug,problem_slug:priority[0].slug,completed:true,bookmarked:false}]);expect(summaries[0].completed).toBe(1);expect(summaries[0].total).toBe(200);expect(summaries[0].bookmarked).toBe(1);
});
