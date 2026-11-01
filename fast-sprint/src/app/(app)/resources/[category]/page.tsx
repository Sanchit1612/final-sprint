import Link from "next/link";
import { notFound } from "next/navigation";
import { LIBRARY } from "@/config/library";
import { PageHeader,Empty } from "@/components/ui";
import { TreeView } from "@/components/TreeView";
import { Filters } from "@/components/Filters";
import { requireSession } from "@/lib/session";
import { loadLearningTree } from "@/lib/content/preview";
export default async function Page({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;status?:string}>}){
 const {category}=await params,c=LIBRARY.find(c=>c.slug===category);if(!c)notFound();
 const {supabase,user,isPro}=await requireSession();
 if(c.pro&&!isPro)return <><PageHeader title={c.title} subtitle="A Pro preparation collection."/><section className="card"><p className="text-muted">{c.status}. Pro access is checked on the server before reading pack contents.</p><Link href="/pricing" className="btn-primary mt-4">Compare plans</Link></section></>;
 const sp=await searchParams,data=await loadLearningTree(supabase,user.id,category,{q:sp.q,status:sp.status},isPro);
 return <><Link href="/resources" className="text-sm text-accent">← Library</Link><PageHeader title={c.title} subtitle={c.status}/>{data?.preview&&<p className="card mb-4 text-sm text-muted">Source review preview. Links and supplied titles are available; missing answers are not invented. Progress, notes and bookmarks activate only after approved publication. This pack is not certified complete.</p>}{data?<><Filters showDifficulty={false}/><TreeView nodes={data.tree} forceOpen={data.filtered} readOnly={data.preview}/></>:<Empty title="No reviewed resources yet">Content will appear after review.</Empty>}</>;
}
