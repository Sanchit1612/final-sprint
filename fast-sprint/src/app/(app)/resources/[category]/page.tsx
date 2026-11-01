import Link from "next/link";
import { notFound } from "next/navigation";
import { ProPreview } from "@/components/ProPreview";
import { LIBRARY, PUBLIC_PRO_HEADINGS } from "@/config/library";
import { PageHeader,Empty } from "@/components/ui";
import { TreeView } from "@/components/TreeView";
import { Filters } from "@/components/Filters";
import { requireSession } from "@/lib/session";
import { loadLearningTree } from "@/lib/content/preview";
export default async function Page({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;status?:string}>}){
 const {category}=await params,c=LIBRARY.find(c=>c.slug===category);if(!c)notFound();
 const {supabase,user,isPro}=await requireSession();
 if(c.pro&&!isPro)return <><PageHeader title={c.title} subtitle="Start with a preview of your next preparation path."/><ProPreview title={c.title} headings={PUBLIC_PRO_HEADINGS[c.slug]??[]} description="Unlock the full collection, follow its learning groups, and keep your preparation organised in one place. Published content supports private progress, notes and bookmarks; review-only packs are labelled clearly."/></>;
 const sp=await searchParams,data=await loadLearningTree(supabase,user.id,category,{q:sp.q,status:sp.status},isPro);
 return <><Link href="/resources" className="text-sm text-accent">← Library</Link><PageHeader title={c.title} subtitle={c.status}/>{data?.preview&&<p className="card mb-4 text-sm text-muted">Source review preview. Links and supplied titles are available; missing answers are not invented. Progress, notes and bookmarks activate only after approved publication. This pack is not certified complete.</p>}{data?<><Filters showDifficulty={false}/><TreeView nodes={data.tree} forceOpen={data.filtered} readOnly={data.preview}/></>:<Empty title="No reviewed resources yet">Content will appear after review.</Empty>}</>;
}
