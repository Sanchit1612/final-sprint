import {parsePractice} from "./practice";
import { LIBRARY } from "@/config/library";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { planManifest } from "./manifest";
import { loadTree, type TreeNode, type Filters } from "../tree";
const allowed = new Set(["dsa-200","dsa-a2z","dsa-neetcode150","os","cn","oop","dbms","sql","development","aptitude","behavioural","interview","companies"]);
/** Server-only review data. Entitlement check precedes premium file reads. */
export async function loadLearningTree(db: SupabaseClient, user: string, slug: string, filters: Filters = {}, isPro = false, directory = join(process.cwd(),"content","collections")) {
 const category=LIBRARY.find(c=>c.slug===slug);
 if(category?.pro&&!isPro)throw new Error("Pro entitlement required");
 const published=await loadTree(db,user,slug,filters);
 if(published&&published.total>0)return {...published,preview:false};
 const path=join(directory,`${slug}.manifest.json`);
 if(!allowed.has(slug)||!existsSync(path))return published?{...published,preview:false}:null;
 const rows=planManifest(JSON.parse(readFileSync(path,"utf8")));
 if(rows.some(r=>r.is_pro)&&!isPro)throw new Error("Premium preview denied");
 const nodes=new Map<string,TreeNode>();
 for(const r of rows.slice(1))if(r.item_type!=="resource")nodes.set(r.path,{practice:parsePractice(r.meta.practice),id:r.id,type:r.item_type,title:r.title,description:r.description,url:r.url,platform:r.url?new URL(r.url).hostname:null,difficulty:r.difficulty??null,tags:[],position:r.position,children:[],resources:[],checkable:false,done:false,revise:false,bookmarked:false,note:"",total:0,completed:0});
 const top:TreeNode[]=[];
 for(const r of rows.slice(1)){
  const parent=r.parentPath?nodes.get(r.parentPath):null;
  if(r.item_type==="resource"){if(parent)parent.resources.push({id:r.id,title:r.title,url:r.url,platform:null});continue;}
  const n=nodes.get(r.path)!;(parent?parent.children:top).push(n);
 }
 const count=(n:TreeNode):number=>{n.checkable=!n.children.length;n.total=n.checkable?1:n.children.reduce((s,c)=>s+count(c),0);return n.total;};
 const total=top.reduce((s,n)=>s+count(n),0);
 const filtered=!!(filters.q||filters.difficulty&&filters.difficulty!=="all");
 const prune=(n:TreeNode):TreeNode|null=>{
  if(n.checkable){if(filters.difficulty&&filters.difficulty!=="all"&&filters.difficulty!==n.difficulty)return null;
   if(filters.q&&!n.title.toLowerCase().includes(filters.q.toLowerCase().trim()))return null;

   return n;}
  const children=n.children.map(prune).filter((c):c is TreeNode=>c!==null);return children.length?{...n,children}:null;
 };
 return {root:{id:rows[0].id,slug,title:rows[0].title,description:rows[0].description},patterns:top.map(n=>({id:n.id,title:n.title})),tree:top.map(prune).filter((n):n is TreeNode=>n!==null),total,completed:0,filtered,preview:true};
}
