import { describe, expect, it } from "vitest";
import { addDays, diffDays, todayIn } from "./dates";

describe("dates", () => {
  it("adds and diffs days across month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(diffDays("2026-11-01", "2026-12-01")).toBe(30);
  });
  it("respects the timezone for 'today'", () => {
    const t = new Date("2026-11-01T20:00:00Z"); // 01:30 next day in India
    expect(todayIn("Asia/Kolkata", t)).toBe("2026-11-02");
    expect(todayIn("UTC", t)).toBe("2026-11-01");
  });
});
