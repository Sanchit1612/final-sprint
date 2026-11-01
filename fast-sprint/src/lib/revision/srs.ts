import { addDays, type ISODate } from "../dates";

/** Days between reviews at each step. A new item is first due 1 day after it is added. */
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120] as const;
export const MAX_STEP = INTERVALS.length - 1;
export type Rating = "again" | "hard" | "good" | "easy";

export interface ReviewOutcome {
  step: number;
  intervalDays: number;
  dueDate: ISODate;
  graduated: boolean;
}

export function firstDue(today: ISODate): ISODate {
  return addDays(today, INTERVALS[0]);
}

/**
 * again → back to step 0 (due tomorrow)
 * hard  → stay on the step, but come back sooner (60% of the interval, at least 1 day)
 * good  → next step
 * easy  → skip one step
 * Passing the last step with good/easy graduates the item.
 */
export function nextReview(step: number, rating: Rating, today: ISODate): ReviewOutcome {
  const cur = Math.min(Math.max(step, 0), MAX_STEP);
  if (rating === "again") return { step: 0, intervalDays: INTERVALS[0], dueDate: addDays(today, INTERVALS[0]), graduated: false };
  if (rating === "hard") {
    const days = Math.max(1, Math.round(INTERVALS[cur] * 0.6));
    return { step: cur, intervalDays: days, dueDate: addDays(today, days), graduated: false };
  }
  const advance = rating === "easy" ? 2 : 1;
  if (cur === MAX_STEP) return { step: MAX_STEP, intervalDays: INTERVALS[MAX_STEP], dueDate: addDays(today, INTERVALS[MAX_STEP]), graduated: true };
  const next = Math.min(cur + advance, MAX_STEP);
  return { step: next, intervalDays: INTERVALS[next], dueDate: addDays(today, INTERVALS[next]), graduated: false };
}

export function previewIntervals(step: number, today: ISODate): Record<Rating, number> {
  const r = (x: Rating) => nextReview(step, x, today).intervalDays;
  return { again: r("again"), hard: r("hard"), good: r("good"), easy: r("easy") };
}
