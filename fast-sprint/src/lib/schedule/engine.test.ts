import { describe, expect, it } from "vitest";
import { TASK_TEMPLATES } from "../../config/task-templates";
import { computeAdjustments, generateSchedule, rescheduleMissed } from "./engine";
import type { ScheduleInput } from "./types";

const base: ScheduleInput = {
  planStart: "2026-11-02", from: "2026-11-02", deadline: "2026-12-27",
  studyDays: [1, 2, 3, 4, 5, 6], dailyMinutes: 180, level: "intermediate",
  hasTrack: true, templates: TASK_TEMPLATES,
};

describe("generateSchedule", () => {
  it("is deterministic", () => {
    expect(generateSchedule(base)).toEqual(generateSchedule(base));
  });
  it("only schedules on chosen study days and never exceeds daily capacity", () => {
    const tasks = generateSchedule(base);
    const perDay = new Map<string, number>();
    for (const t of tasks) {
      const dow = new Date(`${t.scheduledDate}T00:00:00Z`).getUTCDay();
      expect(base.studyDays).toContain(dow);
      perDay.set(t.scheduledDate, (perDay.get(t.scheduledDate) ?? 0) + t.estimatedMinutes);
    }
    for (const m of perDay.values()) expect(m).toBeLessThanOrEqual(180);
    expect(perDay.size).toBeGreaterThan(30);
  });
  it("skips track tasks without a track and honours overrides", () => {
    const noTrack = generateSchedule({ ...base, hasTrack: false });
    expect(noTrack.some((t) => t.templateKey === "dev-track")).toBe(false);
    const off = generateSchedule({ ...base, overrides: { aptitude: { enabled: false } } });
    expect(off.some((t) => t.templateKey === "aptitude")).toBe(false);
  });
  it("adds one weekly review per week on the last study day", () => {
    const reviews = generateSchedule(base).filter((t) => t.kind === "review");
    expect(reviews.length).toBeGreaterThanOrEqual(7);
    for (const r of reviews) expect(new Date(`${r.scheduledDate}T00:00:00Z`).getUTCDay()).toBe(6);
  });
  it("rotates through focus pools", () => {
    const pools = { dsa: [1, 2, 3].map((n) => ({ id: `t${n}`, title: `T${n}`, href: `/dsa/t${n}`, entityType: "dsa_topic" })) };
    const dsa = generateSchedule({ ...base, pools }).filter((t) => t.kind === "dsa").slice(0, 4);
    expect(dsa.map((t) => t.entityId)).toEqual(["t1", "t2", "t3", "t1"]);
  });
  it("handles tiny capacity and past deadlines", () => {
    expect(generateSchedule({ ...base, dailyMinutes: 30 }).every((t) => t.estimatedMinutes >= 15)).toBe(true);
    expect(generateSchedule({ ...base, from: "2027-01-01" })).toEqual([]);
  });
});

describe("rescheduleMissed", () => {
  it("moves missed tasks to the first day with space, oldest first", () => {
    const tasks = [
      { id: "a", scheduledDate: "2026-11-02", estimatedMinutes: 60, sortOrder: 0 },
      { id: "b", scheduledDate: "2026-11-03", estimatedMinutes: 60, sortOrder: 0 },
      { id: "c", scheduledDate: "2026-11-05", estimatedMinutes: 150, sortOrder: 0 },
    ];
    const r = rescheduleMissed({ tasks, today: "2026-11-04", deadline: "2026-11-10", studyDays: [1, 2, 3, 4, 5, 6], dailyMinutes: 180 });
    expect(r.moves).toEqual([{ id: "a", newDate: "2026-11-04" }, { id: "b", newDate: "2026-11-04" }]);
    expect(r.unplaced).toEqual([]);
  });
  it("reports tasks that cannot fit before the deadline", () => {
    const r = rescheduleMissed({
      tasks: [{ id: "a", scheduledDate: "2026-11-01", estimatedMinutes: 60, sortOrder: 0 }],
      today: "2026-11-02", deadline: "2026-11-01", studyDays: [1], dailyMinutes: 120,
    });
    expect(r.unplaced).toEqual(["a"]);
  });
});

describe("computeAdjustments", () => {
  it("makes no changes without enough data", () => {
    expect(computeAdjustments([{ kind: "dsa", planned: 60, completed: 0 }]).adherence).toBeNull();
  });
  it("drops optional blocks and boosts lagging kinds", () => {
    const r = computeAdjustments([
      { kind: "dsa", planned: 300, completed: 60 },
      { kind: "core", planned: 120, completed: 120 },
    ]);
    expect(r.dropOptional).toBe(true);
    expect(r.emphasis.dsa).toBe(1.25);
    expect(r.emphasis.core).toBeUndefined();
  });
});
