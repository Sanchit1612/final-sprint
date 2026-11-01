import { ChevronRight } from "lucide-react";
import type { TreeNode } from "@/lib/tree";
import { ItemRow } from "./ItemRow";
import { ProgressBar } from "./ui";

export function TreeView({ nodes, depth = 0, forceOpen, readOnly = false }: { nodes: TreeNode[]; depth?: number; forceOpen: boolean; readOnly?: boolean }) {
  return (
    <div className={depth === 0 ? "space-y-3" : "space-y-1 border-l border-line pl-3 sm:pl-4"}>
      {nodes.map((n) =>
        n.checkable ? (
          <ItemRow readOnly={readOnly} key={n.id} id={n.id} title={n.title} difficulty={n.difficulty} url={n.url} platform={n.platform} description={n.description}
            done={n.done} revise={n.revise} bookmarked={n.bookmarked} note={n.note} resources={n.resources} />
        ) : (
          <details key={n.id} id={n.id} open={forceOpen} className={depth === 0 ? "group card !p-0" : "group"}>
            <summary className={`flex cursor-pointer list-none items-center gap-3 rounded-xl ${depth === 0 ? "px-4 py-3.5 sm:px-5" : "px-2 py-2 hover:bg-white/[0.03]"}`}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-90" aria-hidden />
              <span className={`flex-1 ${depth === 0 ? "text-base font-semibold" : "text-sm font-medium"}`}>{n.title}</span>
              <span className="w-24 shrink-0 text-right text-xs text-muted">
                {n.completed}/{n.total}
                <ProgressBar value={n.completed} total={n.total} className="mt-1" />
              </span>
            </summary>
            <div className={depth === 0 ? "px-3 pb-3 sm:px-4" : "mt-1"}>
              {n.resources.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 px-2">
                  {n.resources.map((r) => r.url && <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{r.title}</a>)}
                </div>
              )}
              <TreeView nodes={n.children} depth={depth + 1} forceOpen={forceOpen} readOnly={readOnly} />
            </div>
          </details>
        ),
      )}
    </div>
  );
}
