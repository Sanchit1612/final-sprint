"use client";

import { Bookmark, Check, ExternalLink, NotebookPen, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { saveNote, setBookmark, setDone, setRevise } from "@/app/actions";
import type { Res } from "@/lib/tree";

interface Props {
  id: string; title: string; difficulty: string | null; url: string | null; platform: string | null; description: string | null;
  done: boolean; revise: boolean; bookmarked: boolean; note: string; resources: Res[];
}
const DIFF: Record<string, string> = { easy: "text-success", medium: "text-warn", hard: "text-danger" };

export function ItemRow(p: Props) {
  const [done, setDoneS] = useState(p.done);
  const [revise, setReviseS] = useState(p.revise);
  const [marked, setMarked] = useState(p.bookmarked);
  const [note, setNote] = useState(p.note);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, rollback: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) { rollback(); setError(r.error ?? "Could not save. Try again."); }
    });

  return (
    <div id={p.id} className="group scroll-mt-24 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <button
          disabled={pending} type="button" role="checkbox" aria-checked={done} aria-label={`Mark ${p.title} ${done ? "not done" : "done"}`}
          onClick={() => { const v = !done; setDoneS(v); run(() => setDone(p.id, v), () => setDoneS(!v)); }}
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${done ? "border-success bg-success text-black" : "border-line hover:border-accent"}`}
        >
          {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {p.url ? (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className={`text-sm hover:text-accent ${done ? "text-muted line-through" : ""}`}>
                {p.title}<ExternalLink className="ml-1 inline h-3 w-3 text-muted" aria-label="opens in a new tab" />
              </a>
            ) : <span className={`text-sm ${done ? "text-muted line-through" : ""}`}>{p.title}</span>}
            {p.difficulty && <span className={`text-xs capitalize ${DIFF[p.difficulty]}`}>{p.difficulty}</span>}
            {p.platform && <span className="chip">{p.platform}</span>}
          </div>
          {p.description && <p className="mt-0.5 text-xs text-muted">{p.description}</p>}
          {p.resources.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {p.resources.map((r) => r.url && (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{r.title}</a>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn disabled={pending} label={revise ? "Remove from revision" : "Mark for revision"} active={revise} onClick={() => { const v = !revise; setReviseS(v); run(() => setRevise(p.id, v), () => setReviseS(!v)); }}><RotateCcw className="h-4 w-4" /></IconBtn>
          <IconBtn disabled={pending} label={marked ? "Remove bookmark" : "Bookmark"} active={marked} onClick={() => { const v = !marked; setMarked(v); run(() => setBookmark(p.id, v), () => setMarked(!v)); }}><Bookmark className="h-4 w-4" fill={marked ? "currentColor" : "none"} /></IconBtn>
          <IconBtn disabled={pending} label="Notes" active={open || !!note} onClick={() => setOpen((o) => !o)}><NotebookPen className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      {open && (
        <div className="mt-2 pl-8">
          <textarea className="input min-h-24" value={note} maxLength={5000} placeholder="Your approach, mistakes, things to remember" aria-label={`Notes for ${p.title}`}
            onChange={(e) => { setNote(e.target.value); setSaved("idle"); }} />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" className="btn-primary !py-1.5" disabled={pending}
              onClick={() => run(async () => { const r = await saveNote(p.id, note); if (r.ok) setSaved("saved"); return r; }, () => {})}>
              {pending ? "Saving…" : "Save note"}
            </button>
            {saved === "saved" && <span className="text-xs text-success">Saved</span>}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-1 pl-8 text-xs text-danger">{error}</p>}
    </div>
  );
}

function IconBtn({ children, label, active, onClick, disabled }: { children: React.ReactNode; label: string; active: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button disabled={disabled} type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/10 ${active ? "text-accent" : "text-muted"}`}>
      {children}
    </button>
  );
}
