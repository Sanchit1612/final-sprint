"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { addTask } from "@/app/actions";
import { Notice } from "./ui";

export function AddTaskForm({ date }: { date: string }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); start(async () => { setError(null); const r = await addTask({ title, date }); if (r.ok) setTitle(""); else setError(r.error); }); }}>
      <div className="flex gap-2">
        <input className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="What will you do? e.g. Finish 3 array problems" aria-label="New task" />
        <button className="btn-primary shrink-0" disabled={pending || !title.trim()}><Plus className="h-4 w-4" />{pending ? "Adding…" : "Add"}</button>
      </div>
      {error && <Notice>{error}</Notice>}
    </form>
  );
}
