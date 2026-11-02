import {addDays} from '../dates';
/** Fill the least-loaded day first, keeping each day's total at or below capacity. */
export function redistributeMissed(ids:string[],today:string,loads:Record<string,number>,capacity=3) {
 const days=Array.from({length:7},(_,i)=>addDays(today,i)),counts={...loads},moves:{id:string;date:string}[]=[];
 for(const id of ids){const date=[...days].sort((a,b)=>(counts[a]??0)-(counts[b]??0)||a.localeCompare(b)).find(d=>(counts[d]??0)<capacity);if(!date)break;moves.push({id,date});counts[date]=(counts[date]??0)+1;}
 return moves;
}
