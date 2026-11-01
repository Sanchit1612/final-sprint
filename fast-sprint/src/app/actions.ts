"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { applicationSchema, APP_STATUSES, profileSchema, type ApplicationInput, type ProfileInput } from "@/lib/schemas";
import { isISODate } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
const fail = (e: { message: string } | string): Result => {
  const m = typeof e === "string" ? e : e.message;
  return { ok: false, error: m.startsWith("plan_limit:") ? m.slice(11).trim() : m };
};
const refresh = () => revalidatePath("/", "layout");
const uuid = z.string().uuid();

// ───────── checklist progress ─────────
export async function setDone(itemId: string, done: boolean): Promise<Result> {
  if (!uuid.safeParse(itemId).success) return fail("Invalid item.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("user_item_progress").upsert({
    user_id: user.id, item_id: itemId, status: done ? "done" : "not_started", completed_at: done ? new Date().toISOString() : null,
  }, { onConflict: "user_id,item_id" });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function setRevise(itemId: string, value: boolean): Promise<Result> {
  if (!uuid.safeParse(itemId).success) return fail("Invalid item.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("user_item_progress").upsert(
    { user_id: user.id, item_id: itemId, needs_revision: value }, { onConflict: "user_id,item_id", ignoreDuplicates: false });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function setBookmark(itemId: string, value: boolean): Promise<Result> {
  if (!uuid.safeParse(itemId).success) return fail("Invalid item.");
  const { supabase, user } = await requireSession();
  const { error } = value
    ? await supabase.from("user_bookmarks").upsert({ user_id: user.id, item_id: itemId }, { onConflict: "user_id,item_id" })
    : await supabase.from("user_bookmarks").delete().eq("user_id", user.id).eq("item_id", itemId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function saveNote(itemId: string, body: string): Promise<Result> {
  if (!uuid.safeParse(itemId).success) return fail("Invalid item.");
  const text = body.slice(0, 5000);
  const { supabase, user } = await requireSession();
  const { error } = text.trim()
    ? await supabase.from("user_notes").upsert({ user_id: user.id, item_id: itemId, body: text }, { onConflict: "user_id,item_id" })
    : await supabase.from("user_notes").delete().eq("user_id", user.id).eq("item_id", itemId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ───────── daily sprint ─────────
const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task").max(200),
  date: z.string().refine(isISODate, "Invalid date"),
  notes: z.string().trim().max(500).optional(),
  itemId: uuid.optional(),
});
export async function addTask(input: z.infer<typeof taskSchema>): Promise<Result> {
  const p = taskSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("daily_tasks").insert({
    user_id: user.id, task_date: p.data.date, title: p.data.title, notes: p.data.notes || null, item_id: p.data.itemId ?? null,
  });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
export async function setTaskDone(id: string, done: boolean): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("Invalid task.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("daily_tasks").update({ status: done ? "done" : "pending", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id).eq("user_id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
export async function moveTask(id: string, date: string): Promise<Result> {
  if (!uuid.safeParse(id).success || !isISODate(date)) return fail("Invalid request.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("daily_tasks").update({ task_date: date }).eq("id", id).eq("user_id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
export async function deleteTask(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("Invalid task.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("daily_tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ───────── applications ─────────
export async function addApplication(input: ApplicationInput): Promise<Result> {
  const p = applicationSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("applications").insert({ ...p.data, user_id: user.id });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
export async function setApplicationStatus(id: string, status: string): Promise<Result> {
  const s = z.enum(APP_STATUSES).safeParse(status);
  if (!uuid.safeParse(id).success || !s.success) return fail("Invalid request.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("applications").update({ status: s.data }).eq("id", id).eq("user_id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
export async function deleteApplication(id: string): Promise<Result> {
  if (!uuid.safeParse(id).success) return fail("Invalid request.");
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

// ───────── profile ─────────
export async function saveProfile(input: ProfileInput, complete = false): Promise<Result> {
  const p = profileSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const { supabase, user } = await requireSession();
  const d = p.data;
  const { error } = await supabase.from("profiles").update({
    full_name: d.full_name, college: d.college ?? null, branch: d.branch ?? null, graduation_year: d.graduation_year ?? null,
    target_role: d.target_role ?? null, target_company: d.target_company ?? null,
    ...(d.timezone ? { timezone: d.timezone } : {}), ...(complete ? { onboarded_at: new Date().toISOString() } : {}),
  }).eq("id", user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Could not log out. Please try again.");
  redirect("/");
}
