import {randomInt} from 'node:crypto';
import raw from '../../../content/assessment/cs-bank.json';
import {z} from 'zod';
export const subjects=['mixed','dbms','os','cn','oop'] as const;
export const questionSchema=z.object({id:z.string(),subject:z.enum(['dbms','os','cn','oop']),topic:z.string().min(1),difficulty:z.enum(['easy','medium','hard']),question:z.string().min(20),options:z.array(z.string().min(1)).length(4),correct:z.number().int().min(0).max(3),explanation:z.string().min(40)});
export type Question=z.infer<typeof questionSchema>;
export type PublicQuestion=Omit<Question,'correct'|'explanation'>;
export const bank=z.array(questionSchema).parse(raw);
function shuffle<T>(items:T[]):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
export function selectQuestions(subject:typeof subjects[number],count:number):Question[]{
 if(![10,15,20].includes(count))throw Error('Choose 10, 15 or 20 questions');
 let selected:Question[];
 if(subject==='mixed'){const pools=shuffle(subjects.slice(1)).map(s=>shuffle(bank.filter(q=>q.subject===s)));selected=[];while(selected.length<count)for(const pool of pools){if(selected.length<count)selected.push(pool.shift()!);}}
 else selected=shuffle(bank.filter(q=>q.subject===subject)).slice(0,count);
 if(selected.length!==count)throw Error('Insufficient reviewed questions');
 return shuffle(selected).map(q=>{const order=shuffle([0,1,2,3]);return {...q,options:order.map(i=>q.options[i]),correct:order.indexOf(q.correct)};});
}
export function publicQuestions(questions:Question[]):PublicQuestion[]{return questions.map(({id,subject,topic,difficulty,question,options})=>({id,subject,topic,difficulty,question,options}));}
export const assessmentsEnabled=()=>process.env.ASSESSMENTS_ENABLED==='true';
