"use client";

import Link from "next/link";
import {editSprintTask} from "@/app/actions/preparation";
import { ArrowRightToLine, Check, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteTask, moveTask, setTaskDone } from "@/app/actions";

export interface TaskItem { id: string; title: string; notes: string | null; status: "pending" | "done"; task_date: string }

export function TaskList({ tasks, moveTo }: { tasks: TaskItem[]; moveTo?: string }) {
  const [editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState(""),[date,setDate]=useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { setError(null); const r = await fn(); if (!r.ok) setError(r.error ?? "Could not save."); });

  return (
    <div>
      <ul className="divide-y divide-line">
        {tasks.map((t) => { const resource=t.notes?.match(/ · (\/(?:dsa\?collection=[a-z0-9-]+|core\/[a-z0-9-]+|resources\/[a-z0-9-]+)#[a-f0-9-]+)$/)?.[1]; return (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <button type="button" role="checkbox" aria-checked={t.status === "done"} aria-label={`Mark "${t.title}" ${t.status === "done" ? "not done" : "done"}`} disabled={pending}
              onClick={() => run(() => setTaskDone(t.id, t.status !== "done"))}
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${t.status === "done" ? "border-success bg-success text-black" : "border-line hover:border-accent"}`}>
              {t.status === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</p>
              {t.notes && <p className="mt-0.5 text-xs text-muted">{resource?t.notes.split(" · /")[0]:t.notes}{resource&&<Link className="ml-2 text-accent" href={resource}>Open learning item →</Link>}</p>}
              {editing===t.id?<div className="mt-2 flex flex-wrap gap-2"><input aria-label="Edit task title" maxLength={200} className="input" value={draft} onChange={e=>setDraft(e.target.value)}/><input aria-label="Reschedule task" type="date" className="input !w-auto" value={date} onChange={e=>setDate(e.target.value)}/><button disabled={pending} className="btn-ghost" onClick={()=>run(async()=>{const r=await editSprintTask(t.id,draft,date);if(r.ok)setEditing(null);return r;})}>Save changes</button><button className="btn-ghost" onClick={()=>setEditing(null)}>Cancel</button></div>:<button className="mt-1 text-xs text-accent" disabled={pending} onClick={()=>{setEditing(t.id);setDraft(t.title);setDate(t.task_date);}}>Edit or reschedule</button>}
            </div>
            {moveTo && t.status === "pending" && (
              <button type="button" title="Move to today" aria-label={`Move "${t.title}" to today`} disabled={pending} onClick={() => run(() => moveTask(t.id, moveTo))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-white"><ArrowRightToLine className="h-4 w-4" /></button>
            )}
            <button type="button" title="Delete task" aria-label={`Delete "${t.title}"`} disabled={pending} onClick={() => run(() => deleteTask(t.id))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
          </li>
        );})}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
