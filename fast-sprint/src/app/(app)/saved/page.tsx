import { BrowserSavedItems } from "@/components/BrowserSavedItems";
import { learningHref } from "@/config/dsa";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Empty, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";
import {learningStates} from '@/lib/learning-sync';
import {manifestLeaves} from '@/lib/content/files';
import { fetchAll, getRoots } from "@/lib/tree";

export const metadata = { title: "Saved" };
const TABS = [{ id: "bookmarks", label: "Bookmarks" }, { id: "notes", label: "Notes" }, { id: "revision", label: "Needs revision" }] as const;

interface Item { id: string; title: string; root_id: string; url: string | null; body?: string; href?:string }

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab = TABS.find((t) => t.id === raw)?.id ?? "bookmarks";
  const { supabase, user, isPro } = await requireSession();
  const roots = await getRoots(supabase);
  const slugOf = new Map(roots.map((r) => [r.id, r.slug]));
  const hrefFor = (i: Item) => { if(i.href)return i.href;const s = slugOf.get(i.root_id); return s ? `${learningHref(s)}#${i.id}` : "/dsa"; };

  let items: Item[] = [];
  const cols = "id,title,root_id,url";
  if (tab === "bookmarks") {
    const data = await fetchAll<{ content_items: unknown }>((a, b) => supabase.from("user_bookmarks").select(`created_at, content_items(${cols})`).order("created_at", { ascending: false }).order("item_id").range(a, b));
    items = (data ?? []).flatMap((r: { content_items: unknown }) => (r.content_items ? [r.content_items as Item] : []));
  } else if (tab === "notes") {
    const data = await fetchAll<{ body: string; content_items: unknown }>((a, b) => supabase.from("user_notes").select(`body,updated_at, content_items(${cols})`).order("updated_at", { ascending: false }).order("item_id").range(a, b));
    items = (data ?? []).flatMap((r: { body: string; content_items: unknown }) => (r.content_items ? [{ ...(r.content_items as Item), body: r.body }] : []));
  } else {
    const data = await fetchAll<{ content_items: unknown }>((a, b) => supabase.from("user_item_progress").select(`updated_at, content_items(${cols})`).eq("needs_revision", true).order("updated_at", { ascending: false }).order("item_id").range(a, b));
    items = (data ?? []).flatMap((r: { content_items: unknown }) => (r.content_items ? [r.content_items as Item] : []));
  }

  const cloud=await learningStates(supabase,user.id);
  for(const root of new Set(cloud.map(r=>r.root_slug))){
    try{const leaves=new Map(manifestLeaves(root,isPro).map(r=>[r.id,r]));
      for(const state of cloud.filter(r=>r.root_slug===root)){
        const row=leaves.get(state.item_id);if(!row||!(tab==='bookmarks'?state.bookmarked:tab==='notes'?state.note.trim():state.revise))continue;
        items.push({id:row.id,title:row.title,root_id:root,url:row.url,body:tab==='notes'?state.note:undefined,href:learningHref(root)+'#'+row.id});
      }
    }catch{/* An expired Pro pack is not delivered through Saved. */}
  }
  return (
    <>
      <PageHeader title="Saved" subtitle="Your bookmarks, notes and items flagged for revision." />
      <div className="mb-5 flex gap-1 rounded-xl border border-line bg-surface p-1 sm:w-fit" role="tablist">
        {TABS.map((t) => (
          <Link key={t.id} href={`/saved?tab=${t.id}`} role="tab" aria-selected={tab === t.id} className={`flex-1 rounded-lg px-4 py-2 text-center text-sm transition sm:flex-none ${tab === t.id ? "bg-accent-soft text-accent" : "text-muted hover:text-white"}`}>{t.label}</Link>
        ))}
      </div>
      <BrowserSavedItems key={`${user.id}:${tab}:${isPro}`} user={user.id} isPro={isPro} tab={tab} />
      {items.length === 0 ? (
        <Empty title={tab === "bookmarks" ? "No account bookmarks yet" : tab === "notes" ? "No account notes yet" : "No account revision flags yet"}>
          {tab === "bookmarks" ? "Tap the bookmark icon on any problem or topic." : tab === "notes" ? "Open the notes icon on any item to write one." : "Tap the revision icon on an item you want to come back to."}
        </Empty>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="card !p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={hrefFor(i)} className="font-medium hover:text-accent">{i.title}</Link>
                {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${i.title} in a new tab`} className="text-muted hover:text-white"><ExternalLink className="h-4 w-4" /></a>}
              </div>
              {i.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{i.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
