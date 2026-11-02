import {z} from 'zod';
export const practiceSchema=z.object({question:z.string().min(1).max(10000),options:z.array(z.object({id:z.string().min(1).max(12),text:z.string().min(1).max(1500)})).max(10),correctOptions:z.array(z.string()).max(10),acceptedText:z.array(z.string().min(1)).max(10).default([]),answer:z.string().min(1).max(1500),explanation:z.string().min(1).max(5000),assumption:z.string().max(1000).default(''),sourceLabel:z.string().max(1000)}).superRefine((p,ctx)=>{
 const ids=p.options.map(o=>o.id);
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Duplicate option IDs'});
 if(p.options.length ? !p.correctOptions.length||p.correctOptions.some(c=>!ids.includes(c)) : !p.acceptedText.length)ctx.addIssue({code:'custom',message:'A reviewed answer must match the available response format'});
});
export type PracticeData=z.infer<typeof practiceSchema>;
export function parsePractice(value:unknown):PracticeData|undefined {const p=practiceSchema.safeParse(value);return p.success?p.data:undefined;}
export function checkPractice(p:PracticeData,response:string) {
 return p.options.length?p.correctOptions.includes(response):p.acceptedText.some(s=>s.trim().toLocaleLowerCase()===response.trim().toLocaleLowerCase());
}
