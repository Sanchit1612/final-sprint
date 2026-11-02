import {existsSync,readFileSync} from 'node:fs';import {expect,it} from 'vitest';import {companyIndex,companySheet} from './companies';
it('rejects unknown company paths and validates private sheets against official access evidence when available',()=>{
 expect(companySheet('../.env.local')).toBeNull();const index=companyIndex();if(!index.length)return;
 expect(index).toHaveLength(50);const proofPath='backups/company-review/leetcode-access.json';const proof=existsSync(proofPath)?new Map(JSON.parse(readFileSync(proofPath,'utf8')).map((r:{titleSlug:string;isPaidOnly:boolean})=>[r.titleSlug,r.isPaidOnly])):null;
 for(const c of index){const sheet=companySheet(c.slug)!;expect(sheet.problems).toHaveLength(c.count);expect(new Set(sheet.problems.map(p=>p.slug)).size).toBe(c.count);for(const p of sheet.problems){expect(p.paidOnly).toBe(false);expect(p.url).toBe(`https://leetcode.com/problems/${p.slug}/`);if(proof)expect(proof.get(p.slug)).toBe(false);}expect(sheet.problems.every((p,i,a)=>i===0||a[i-1].frequency>=p.frequency)).toBe(true);}
});
