import {addDays,diffDays,isISODate} from '../dates';
import {generateSchedule} from './engine';
import type {FocusItem,TaskTemplate} from './types';
export interface CountdownInput {today:string;deadline:string;minutes:number;role:string;dsa:FocusItem[];core:FocusItem[];revision:FocusItem[]}
export function countdownPlan(input:CountdownInput) {
 if(!isISODate(input.today)||!isISODate(input.deadline)||input.deadline<input.today||diffDays(input.today,input.deadline)>730||!Number.isFinite(input.minutes)||input.minutes<30||input.minutes>480)throw new Error('Choose a valid date within two years and 30–480 daily minutes.');
 const days=diffDays(input.today,input.deadline)+1,templates:TaskTemplate[]=[];
 const template=(key:string,kind:TaskTemplate['kind'],title:string,weight:number):TaskTemplate=>({key,kind,title,minMinutes:15,baseWeight:weight,phaseWeights:{build:1,practice:1,final:1},levelMultipliers:{beginner:1,intermediate:1,advanced:1},cadence:'daily',defaultHref:'/sprint'});
 if(input.dsa.length)templates.push(template('dsa','dsa','DSA practice',6));
 if(input.core.length)templates.push(template('core','core','Core CS review',3));
 if(input.revision.length)templates.push(template('revision','revision','Flagged revision',3));
 templates.push(template('interview','interview',`${input.role.trim().slice(0,70)||'Placement'}: interview preparation`,1));
 const pools={dsa:input.dsa,core:input.core,revision:input.revision};
 const generated=generateSchedule({planStart:input.today,from:input.today,deadline:addDays(input.today,Math.min(6,days-1)),studyDays:[0,1,2,3,4,5,6],dailyMinutes:input.minutes,level:'intermediate',hasTrack:false,templates,pools});
 let cursor=0;
 const expanded=generated.flatMap(t=>{if(t.kind!=='dsa')return [t];const count=Math.min(3,Math.max(1,Math.floor(t.estimatedMinutes/30)),input.dsa.length-cursor);if(count<=0)return [];return Array.from({length:count},()=>{const focus=input.dsa[cursor++];return {...t,title:`DSA practice: ${focus.title}`,entityId:focus.id,href:focus.href,estimatedMinutes:Math.floor(t.estimatedMinutes/count)};});});
 const seen=new Set<string>();const tasks=expanded.filter(t=>{if(!t.entityId)return true;const key=t.kind+':'+t.entityId;if(seen.has(key))return false;seen.add(key);return true;});
 const scheduledDsa=tasks.filter(t=>t.kind==='dsa').length;
 return {days,scheduledDsa,weeklyMinutes:Math.min(7,days)*input.minutes,dailyProblems:Math.ceil(input.dsa.length/days),tasks};
}
