import { describe, expect, it } from "vitest";
import { INTERVALS, MAX_STEP, nextReview } from "./srs";

describe("nextReview", () => {
  it("good advances one step", () => {
    const r = nextReview(0, "good", "2026-11-01");
    expect(r.step).toBe(1);
    expect(r.dueDate).toBe("2026-11-04");
  });
  it("again resets to tomorrow", () => {
    const r = nextReview(4, "again", "2026-11-01");
    expect(r).toMatchObject({ step: 0, dueDate: "2026-11-02" });
  });
  it("easy skips a step and hard repeats sooner", () => {
    expect(nextReview(1, "easy", "2026-11-01").step).toBe(3);
    const h = nextReview(3, "hard", "2026-11-01");
    expect(h.step).toBe(3);
    expect(h.intervalDays).toBeLessThan(INTERVALS[3]);
  });
  it("graduates after the final step", () => {
    expect(nextReview(MAX_STEP, "good", "2026-11-01").graduated).toBe(true);
    expect(nextReview(MAX_STEP - 1, "good", "2026-11-01").graduated).toBe(false);
  });
});
