"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addApplication, deleteApplication, setApplicationStatus } from "@/app/actions";
import { applicationSchema, type ApplicationInput } from "@/lib/schemas";
import { formatDay } from "@/lib/dates";
import { Empty, Notice } from "./ui";

export const STATUS_LABEL: Record<string, string> = {
  wishlist: "Wishlist", applied: "Applied", online_assessment: "Online assessment", interview: "Interview", offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn",
};
export interface App { id: string; company: string; role: string; status: string; applied_on: string | null; deadline: string | null; job_url: string | null; notes: string | null }

export function ApplicationsBoard({ apps }: { apps: App[] }) {
  const [showForm, setShowForm] = useState(apps.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema) as never, defaultValues: { status: "wishlist" },
  });

  const submit = handleSubmit(async (v) => {
    setError(null);
    const r = await addApplication(v);
    if (!r.ok) return setError(r.error);
    reset({ status: "wishlist" }); setShowForm(false);
  });
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { setError(null); const r = await fn(); if (!r.ok) setError(r.error ?? "Could not save."); });

  const groups = Object.keys(STATUS_LABEL).map((s) => ({ s, items: apps.filter((a) => a.status === s) })).filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <div>
        {!showForm ? <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Add application</button> : (
          <form onSubmit={submit} className="card space-y-4" noValidate>
            <h2 className="text-lg">New application</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="company">Company</label><input id="company" className="input" {...register("company")} />{errors.company && <p className="field-error">{errors.company.message}</p>}</div>
              <div><label className="label" htmlFor="role">Role</label><input id="role" className="input" {...register("role")} />{errors.role && <p className="field-error">{errors.role.message}</p>}</div>
              <div><label className="label" htmlFor="status">Status</label>
                <select id="status" className="input" {...register("status")}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label className="label" htmlFor="job_url">Job link (optional)</label><input id="job_url" className="input" placeholder="https://" {...register("job_url")} />{errors.job_url && <p className="field-error">{errors.job_url.message}</p>}</div>
              <div><label className="label" htmlFor="applied_on">Applied on</label><input id="applied_on" type="date" className="input" {...register("applied_on")} /></div>
              <div><label className="label" htmlFor="deadline">Deadline</label><input id="deadline" type="date" className="input" {...register("deadline")} /></div>
            </div>
            <div><label className="label" htmlFor="notes">Notes</label><textarea id="notes" className="input min-h-20" {...register("notes")} /></div>
            {error && <Notice>{error}</Notice>}
            <div className="flex gap-2"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save application"}</button>{apps.length > 0 && <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>}</div>
          </form>
        )}
        {!showForm && error && <div className="mt-3"><Notice>{error}</Notice></div>}
      </div>

      {apps.length === 0 ? (!showForm && <Empty title="No applications yet">Track every company you apply to, from wishlist to offer.</Empty>) : groups.map(({ s, items }) => (
        <section key={s}>
          <h2 className="mb-2 text-sm text-muted">{STATUS_LABEL[s]} · {items.length}</h2>
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="card !p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.company} <span className="font-normal text-muted">· {a.role}</span></p>
                  <p className="mt-0.5 text-xs text-muted">
                    {a.applied_on && <>Applied {formatDay(a.applied_on)} </>}{a.deadline && <>· Deadline {formatDay(a.deadline)}</>}
                    {a.job_url && <> · <a className="text-accent hover:underline" href={a.job_url} target="_blank" rel="noopener noreferrer">Job link <ExternalLink className="inline h-3 w-3" aria-hidden /></a></>}
                  </p>
                  {a.notes && <p className="mt-1 text-sm text-muted">{a.notes}</p>}
                </div>
                <select aria-label={`Status for ${a.company}`} className="input !w-auto" value={a.status} disabled={pending} onChange={(e) => run(() => setApplicationStatus(a.id, e.target.value))}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button aria-label={`Delete ${a.company} application`} title="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" disabled={pending}
                  onClick={() => { if (confirm(`Delete the ${a.company} application?`)) run(() => deleteApplication(a.id)); }}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
