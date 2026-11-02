export interface RankedProblem {slug:string;frequency:number;topics?:string[];coreRelevance?:boolean}
/** Frequency is the dominant signal. Coverage rewards underrepresented official topics;
 * Master 200 overlap is a small foundational relevance boost. Never changes source frequency. */
export function priorityProblems<T extends RankedProblem>(problems:T[],limit=200):T[] {
 const remaining=[...problems],selected:T[]=[],coverage=new Map<string,number>();
 const max=Math.max(1,...remaining.map(p=>p.frequency));
 while(remaining.length&&selected.length<limit){
  const score=(p:T)=>.7*p.frequency/max+.15*Number(!!p.coreRelevance)+.15*(p.topics?.length?Math.max(...p.topics.map(t=>1/(1+(coverage.get(t)??0)))):0);
  let best=0,bestScore=score(remaining[0]);
  for(let i=1;i<remaining.length;i++){const candidate=remaining[i],value=score(candidate),current=remaining[best];if(value>bestScore||value===bestScore&&(candidate.frequency>current.frequency||candidate.frequency===current.frequency&&candidate.slug.localeCompare(current.slug)<0)){best=i;bestScore=value;}}
  const [p]=remaining.splice(best,1);selected.push(p);for(const t of p.topics??[])coverage.set(t,(coverage.get(t)??0)+1);
 }
 return selected;
}
