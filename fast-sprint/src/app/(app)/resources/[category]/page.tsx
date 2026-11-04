import { HashOpener } from "@/components/HashOpener";
import {LibraryStudyPath} from "@/components/LibraryStudyPath";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ProPreview } from "@/components/ProPreview";
import { LIBRARY, PUBLIC_PRO_HEADINGS } from "@/config/library";
import { PageHeader,Empty } from "@/components/ui";
import { TreeView } from "@/components/TreeView";
import { Filters } from "@/components/Filters";
import { requireSession } from "@/lib/session";
import { loadLearningTree } from "@/lib/content/preview";
export default async function Page({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<{q?:string;status?:string}>}){
 const {category}=await params;if(category==="companies")redirect("/companies");const c=LIBRARY.find(c=>c.slug===category);if(!c)notFound();
 const {supabase,user,isPro}=await requireSession();
 if(c.pro&&!isPro)return <><PageHeader title={c.title} subtitle="Start with a preview of your next preparation path."/><ProPreview title={c.title} headings={PUBLIC_PRO_HEADINGS[c.slug]??[]} description="Unlock the full collection, follow its learning groups, and keep your preparation organised in one place. Published content supports private progress, notes and bookmarks; Some collections save your work in this browser."/></>;
 const sp=await searchParams,data=await loadLearningTree(supabase,user.id,category,{q:sp.q,status:sp.status},isPro);
 return <><Link href="/resources" className="text-sm text-accent">← Library</Link><PageHeader title={c.title} subtitle="Follow the study path, try an exercise and work through the topic checklist."/><LibraryStudyPath slug={category}/>{data?.preview&&<p className="card mb-4 text-sm text-muted">Your checklist, notes and bookmarks for this collection are saved in this browser.</p>}{data?<><Filters showStatus={!data.preview} showDifficulty={false}/><HashOpener/><TreeView localStudy={data.preview ? { user: user.id, href: `/resources/${category}`, requiresPro: c.pro } : undefined} hideGitHubLinks nodes={data.tree} forceOpen={data.filtered} readOnly={data.preview}/></>:<Empty title="No topics available">Use the study path above to get started.</Empty>}</>;
}
