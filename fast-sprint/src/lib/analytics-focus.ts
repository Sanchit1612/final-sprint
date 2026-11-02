/** Follow the collection the learner last used, rather than an untouched alternative. */
export function chooseFocus<T extends {root:{slug:string};data:{lastActivity:string|null;completed:number}}>(collections:T[],requested?:string):T|undefined {
 return collections.find(c=>c.root.slug===requested)??[...collections].sort((a,b)=>(b.data.lastActivity??'').localeCompare(a.data.lastActivity??'')||b.data.completed-a.data.completed)[0];
}
export interface CoverageGroup {id:string;title:string;total:number;completed:number;revision:number;children:CoverageGroup[]}
export function preparationMoves(groups:CoverageGroup[]) {
 return groups.filter(g=>g.revision>0||g.completed<g.total).sort((a,b)=>b.revision-a.revision||Number(b.completed>0)-Number(a.completed>0)||a.completed/a.total-b.completed/b.total).slice(0,3);
}
export function nextIncomplete(group:CoverageGroup):CoverageGroup|undefined {
 if(!group.children.length)return group.completed?undefined:group;
 return group.children.map(nextIncomplete).find(Boolean);
}
