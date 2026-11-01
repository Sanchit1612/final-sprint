import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./auth-redirect";
import { isISODate } from "./dates";
import { fetchAll } from "./tree";
import { isProActive } from "../config/plans";

describe("authentication boundaries", () => {
  it("rejects external and backslash redirects", () => {
    for (const value of [null, "https://evil.example", "//evil.example", "/\\evil.example", "/\n/evil.example"]) expect(safeAuthRedirect(value)).toBe("/dashboard");
    expect(safeAuthRedirect("/reset-password")).toBe("/reset-password");
  });
  it("expires access at the expiry instant and rejects future grants", () => {
    const grant = { plan: "pro", status: "active", starts_at: "2026-01-01", expires_at: "2026-11-01T00:00:00Z" };
    expect(isProActive(grant, new Date(grant.expires_at))).toBe(false);
    expect(isProActive({ ...grant, starts_at: "invalid" }, new Date("2026-10-01"))).toBe(false);
    expect(isProActive({ ...grant, starts_at: "2027-01-01" }, new Date("2026-10-01"))).toBe(false);
    expect(isProActive({ ...grant, status: "revoked" }, new Date("2026-10-01"))).toBe(false);
  });
});
describe("read reliability", () => {
  it("loads beyond the first page", async () => {
    const rows = await fetchAll(async (from) => ({ data: from === 0 ? Array.from({ length: 1000 }, (_, i) => i) : [1000], error: null }));
    expect(rows).toHaveLength(1001);
  });
  it("does not turn a failed page into partial data", async () => {
    await expect(fetchAll(async () => ({ data: null, error: { message: "offline" } }))).rejects.toThrow("offline");
  });
  it("rejects invalid calendar dates", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("2028-02-29")).toBe(true);
  });
});
