import {existsSync,readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {planManifest} from './manifest';
import {practiceSchema} from './practice';
import {interviewAnswerSchema} from './interview-answer';
it('validates every privately packaged aptitude exercise and original interview answer when supplied',()=>{
 const apt='content/collections/aptitude.manifest.json',interview='content/collections/interview.manifest.json';if(!existsSync(apt)||!existsSync(interview))return;
 const ar=planManifest(JSON.parse(readFileSync(apt,'utf8'))),ir=planManifest(JSON.parse(readFileSync(interview,'utf8')));
 const exercises=ar.filter(r=>r.meta.practice),answers=ir.filter(r=>r.meta.interviewAnswer);
 expect(exercises).toHaveLength(142);expect(answers).toHaveLength(59);
 for(const r of exercises){const p=practiceSchema.parse(r.meta.practice);if(p.sourceLabel==='Fast Sprint original exercise'){expect(p.options).toHaveLength(4);const ids=p.correctOptions.map(id=>p.options.find(o=>o.id===id)?.text);expect(ids).toContain(p.answer);}expect(p.explanation.length).toBeGreaterThan(30);}
 for(const r of answers)interviewAnswerSchema.parse(r.meta.interviewAnswer);
 expect(new Set(exercises.map(r=>(r.meta.practice as {question:string}).question)).size).toBe(142);
});
it('checks interview SQL examples against duplicate ranks and missing fourth values',async()=>{
 const db=new PGlite();try{
  await db.exec('create table numbers(value integer);insert into numbers values(9),(9),(7),(5),(3),(3),(null);create table furniture(id integer,width integer,height integer,length integer);insert into furniture values(1,10,20,30),(2,30,20,10);');
  const query='SELECT value FROM (SELECT value,DENSE_RANK() OVER (ORDER BY value DESC) AS r FROM numbers WHERE value IS NOT NULL) ranked WHERE r=4 GROUP BY value';
  expect((await db.query(query)).rows).toEqual([{value:3}]);await db.exec('delete from numbers where value=3;');expect((await db.query(query)).rows).toEqual([]);
  expect((await db.query('SELECT id,width,height,length FROM furniture WHERE width=$1 AND height=$2 AND length=$3',[10,20,30])).rows).toEqual([{id:1,width:10,height:20,length:30}]);
 }finally{await db.close();}
});
