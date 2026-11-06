import {companyTrackingEnabled} from "@/lib/company-progress";
import { ChevronRight } from "lucide-react";
import type { TreeNode } from "@/lib/tree";
import { ItemRow } from "./ItemRow";
import { ProgressBar } from "./ui";

function isLearningLink(url: string | null) {
  if (!url) return false;
  try {
    const { hostname, protocol } = new URL(url);
    return ["http:", "https:"].includes(protocol) &&
      !/(^|\.)(github\.com|github\.io|githubusercontent\.com|githubassets\.com|github\.dev|ghcr\.io)$/.test(hostname.replace(/\.$/, ""));
  } catch {
    return false;
  }
}

function displayDescription(description: string | null) {
  if (!description) return null;
  if (/^(Uploaded title and order preserved|Original uploaded heading preserved|Link-out source index)/i.test(description)) return null;
  return description;
}

export function TreeView({ nodes, depth = 0, forceOpen, readOnly = false, signInHref, hideGitHubLinks = false, localStudy }: { nodes: TreeNode[]; depth?: number; forceOpen: boolean; readOnly?: boolean; signInHref?:string; hideGitHubLinks?: boolean; localStudy?: { user: string; href: string; requiresPro?: boolean; root?:string; cloud?:boolean } }) {
  return (
    <div className={depth === 0 ? "space-y-3" : "space-y-1 border-l border-line pl-3 sm:pl-4"}>
      {nodes.map((n) => {
        const resources = (hideGitHubLinks ? n.resources.filter(resource => isLearningLink(resource.url)) : n.resources)
          .map(resource => resource.title === "Striver publisher lesson (method coverage unverified)"
            ? { ...resource, title: "Striver lesson" }
            : resource);
        const url = hideGitHubLinks && !isLearningLink(n.url) ? null : n.url;
        return n.checkable ? (
          <ItemRow signInHref={signInHref} interviewAnswer={n.interviewAnswer} localStudy={localStudy} allowReview={companyTrackingEnabled()} practice={n.practice} readOnly={readOnly} key={n.id} id={n.id} title={n.title} difficulty={n.difficulty} url={url} platform={url ? n.platform : null} description={displayDescription(n.description)}
            done={n.done} revise={n.revise} bookmarked={n.bookmarked} note={n.note} resources={resources} />
        ) : (
          <details key={n.id} id={n.id} open={forceOpen} className={depth === 0 ? "group card !p-0" : "group"}>
            <summary className={`flex cursor-pointer list-none items-center gap-3 rounded-xl ${depth === 0 ? "px-4 py-3.5 sm:px-5" : "px-2 py-2 hover:bg-white/[0.03]"}`}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-90" aria-hidden />
              <span className={`flex-1 ${depth === 0 ? "text-base font-semibold" : "text-sm font-medium"}`}>{n.title}</span>
              <span className="w-24 shrink-0 text-right text-xs text-muted">
                {localStudy&&!localStudy.cloud ? `${n.total} items` : <>
                  {n.completed}/{n.total}
                  <ProgressBar value={n.completed} total={n.total} className="mt-1" />
                </>}
              </span>
            </summary>
            <div className={depth === 0 ? "px-3 pb-3 sm:px-4" : "mt-1"}>
              {resources.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 px-2">
                  {resources.map((r) => r.url && <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{r.title}</a>)}
                </div>
              )}
              <TreeView signInHref={signInHref} localStudy={localStudy} nodes={n.children} hideGitHubLinks={hideGitHubLinks} depth={depth + 1} forceOpen={forceOpen} readOnly={readOnly} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
