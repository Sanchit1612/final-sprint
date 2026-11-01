import { beforeEach, expect, it, vi } from "vitest";
const { session, refresh } = vi.hoisted(() => ({ session: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/session", () => ({ requireSession: session }));
vi.mock("next/cache", () => ({ revalidatePath: refresh }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { addTask, moveTask, setApplicationStatus, setDone, saveProfile } from "./actions";
beforeEach(() => { vi.clearAllMocks(); });
it("rejects malformed IDs and calendar dates before a database write", async () => {
  expect((await setDone("bad", true)).ok).toBe(false);
  expect((await addTask({ title: "Task", date: "2026-02-30" })).ok).toBe(false);
  expect((await moveTask("11111111-1111-4111-8111-111111111111", "2026-13-01")).ok).toBe(false);
  expect((await setApplicationStatus("bad", "offer")).ok).toBe(false);
  expect(session).not.toHaveBeenCalled();
});
it("does not write when authentication is rejected", async () => {
  session.mockRejectedValueOnce(new Error("login required"));
  await expect(addTask({ title: "Task", date: "2026-11-01" })).rejects.toThrow("login required");
  expect(refresh).not.toHaveBeenCalled();
});
it("binds inserts to the server identity and surfaces quota errors", async () => {
  const insert = vi.fn().mockResolvedValue({ error: { message: "plan_limit: Daily limit reached" } });
  session.mockResolvedValueOnce({ user: { id: "trusted-user" }, supabase: { from: () => ({ insert }) } });
  expect(await addTask({ title: "Task", date: "2026-11-01", user_id: "forged" } as never)).toEqual({ ok: false, error: "Daily limit reached" });
  expect(insert.mock.calls[0][0].user_id).toBe("trusted-user");
  expect(refresh).not.toHaveBeenCalled();
});
it("rejects invalid profile timezones", async () => {
  expect((await saveProfile({ full_name: "Student", timezone: "invalid-zone" })).ok).toBe(false);
  expect(session).not.toHaveBeenCalled();
});
