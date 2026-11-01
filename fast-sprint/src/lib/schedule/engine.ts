import { dateRange, dayOfWeek, diffDays, startOfWeek, type ISODate } from "../dates";
import type {
  Adjustments, FocusItem, GeneratedTask, Phase, ScheduleInput, TaskKind, TaskLite, TaskTemplate,
} from "./types";

const STEP = 5; // minutes; every block is a multiple of 5

export function phaseFor(date: ISODate, planStart: ISODate, deadline: ISODate): Phase {
  const total = Math.max(1, diffDays(planStart, deadline) + 1);
  const frac = diffDays(planStart, date) / total;
  return frac < 0.4 ? "build" : frac < 0.8 ? "practice" : "final";
}

export function studyDatesBetween(from: ISODate, to: ISODate, studyDays: number[]): ISODate[] {
  if (to < from) return [];
  return dateRange(from, to).filter((d) => studyDays.includes(dayOfWeek(d)));
}

/** Split `units` (multiples of STEP) across weights using the largest-remainder method. Deterministic. */
function apportion(units: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || units <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (units * w) / sum);
  const base = raw.map(Math.floor);
  let left = units - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    base[i] += 1;
    left -= 1;
  }
  return base;
}

function activeTemplates(input: ScheduleInput): TaskTemplate[] {
  const { templates, overrides = {}, hasTrack, adjustments } = input;
  return templates.filter((t) => {
    if (overrides[t.key]?.enabled === false) return false;
    if (t.requiresTrack && !hasTrack) return false;
    if (adjustments?.dropOptional && t.optional) return false;
    return true;
  });
}

/** Minutes each daily template gets on a day with `capacity` minutes. Drops templates below their minimum. */
export function allocateDay(capacity: number, templates: TaskTemplate[], weights: number[]) {
  let idx = templates.map((_, i) => i).filter((i) => weights[i] > 0);
  const units = Math.floor(capacity / STEP);
  while (idx.length > 0) {
    const alloc = apportion(units, idx.map((i) => weights[i]));
    const bad = idx.filter((_, k) => alloc[k] * STEP < templates[idx[k]].minMinutes);
    if (bad.length === 0) return idx.map((i, k) => ({ template: templates[i], minutes: alloc[k] * STEP }));
    // drop the lowest-weight template that is below its minimum (ties: later in list) and retry
    const drop = bad.sort((a, b) => weights[a] - weights[b] || b - a)[0];
    idx = idx.filter((i) => i !== drop);
  }
  return [];
}

export function generateSchedule(input: ScheduleInput): GeneratedTask[] {
  const { planStart, from, deadline, studyDays, dailyMinutes, level, pools = {}, adjustments } = input;
  const templates = activeTemplates(input);
  const daily = templates.filter((t) => t.cadence === "daily");
  const weekly = templates.filter((t) => t.cadence === "weekly");
  const dates = studyDatesBetween(from, deadline, studyDays);
  const counters: Partial<Record<TaskKind, number>> = { ...input.focusOffsets };
  const out: GeneratedTask[] = [];

  const focusFor = (kind: TaskKind): FocusItem | null => {
    const pool = pools[kind];
    if (!pool || pool.length === 0) return null;
    const n = counters[kind] ?? 0;
    counters[kind] = n + 1;
    return pool[n % pool.length];
  };

  const lastStudyDayOfWeek = new Map<ISODate, ISODate>();
  for (const d of studyDatesBetween(planStart, deadline, studyDays)) lastStudyDayOfWeek.set(startOfWeek(d), d);

  for (const date of dates) {
    const phase = phaseFor(date, planStart, deadline);
    let capacity = dailyMinutes;
    let order = 0;
    const push = (t: TaskTemplate, minutes: number) => {
      const focus = focusFor(t.kind);
      out.push({
        scheduledDate: date,
        kind: t.kind,
        templateKey: t.key,
        title: focus ? `${t.title}: ${focus.title}` : t.title,
        description: t.description ?? null,
        estimatedMinutes: minutes,
        entityType: focus?.entityType ?? null,
        entityId: focus?.id ?? null,
        href: focus?.href ?? t.defaultHref,
        sortOrder: order++,
      });
    };

    // weekly blocks go first, on the week's last study day, only if the day is long enough
    if (lastStudyDayOfWeek.get(startOfWeek(date)) === date) {
      for (const t of weekly) {
        const m = Math.min(t.fixedMinutes ?? t.minMinutes, Math.floor((capacity * 0.4) / STEP) * STEP);
        if (m >= t.minMinutes) {
          push(t, m);
          capacity -= m;
        }
      }
    }

    const weights = daily.map(
      (t) => t.baseWeight * t.phaseWeights[phase] * t.levelMultipliers[level] * (adjustments?.emphasis[t.kind] ?? 1),
    );
    for (const { template, minutes } of allocateDay(capacity, daily, weights)) push(template, minutes);
  }
  return out;
}

// ───────────── Missed-task rescheduling ─────────────

export interface RescheduleResult {
  moves: { id: string; newDate: ISODate }[];
  unplaced: string[];
}

/**
 * Pending tasks dated before `today` are "missed". Move each one to the earliest upcoming study day
 * that still has spare capacity. Oldest first, so nothing jumps the queue. Tasks that cannot fit
 * before the deadline are returned as `unplaced`.
 */
export function rescheduleMissed(args: {
  tasks: TaskLite[];
  today: ISODate;
  deadline: ISODate;
  studyDays: number[];
  dailyMinutes: number;
}): RescheduleResult {
  const { tasks, today, deadline, studyDays, dailyMinutes } = args;
  const days = studyDatesBetween(today, deadline, studyDays);
  const load = new Map<ISODate, number>();
  for (const t of tasks) {
    if ((t.status ?? "pending") === "pending" && t.scheduledDate >= today) {
      load.set(t.scheduledDate, (load.get(t.scheduledDate) ?? 0) + t.estimatedMinutes);
    }
  }
  const missed = tasks
    .filter((t) => (t.status ?? "pending") === "pending" && t.scheduledDate < today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.sortOrder - b.sortOrder);

  const moves: RescheduleResult["moves"] = [];
  const unplaced: string[] = [];
  for (const t of missed) {
    const day = days.find((d) => (load.get(d) ?? 0) + t.estimatedMinutes <= dailyMinutes);
    if (!day) {
      unplaced.push(t.id);
      continue;
    }
    load.set(day, (load.get(day) ?? 0) + t.estimatedMinutes);
    moves.push({ id: t.id, newDate: day });
  }
  return { moves, unplaced };
}

// ───────────── Progress-based adjustments ─────────────

export interface AdherenceRow { kind: TaskKind; planned: number; completed: number }
export interface AdjustmentReport extends Adjustments {
  adherence: number | null;
  notes: string[];
}

/**
 * Looks at recent planned vs completed minutes (pass the last ~14 days of due tasks).
 * - Overall completion under 50%: drop optional blocks and lighten the plan.
 * - Any kind under 50% (with enough data): give it 25% more weight so it catches up.
 * - Fewer than 3 planned hours in the window: not enough data, no changes.
 */
export function computeAdjustments(rows: AdherenceRow[]): AdjustmentReport {
  const planned = rows.reduce((a, r) => a + r.planned, 0);
  const done = rows.reduce((a, r) => a + r.completed, 0);
  if (planned < 180) return { dropOptional: false, emphasis: {}, adherence: null, notes: ["Not enough recent history to adjust yet."] };

  const adherence = done / planned;
  const notes: string[] = [];
  const emphasis: Adjustments["emphasis"] = {};
  const byKind = new Map<TaskKind, { p: number; c: number }>();
  for (const r of rows) {
    const e = byKind.get(r.kind) ?? { p: 0, c: 0 };
    e.p += r.planned; e.c += r.completed;
    byKind.set(r.kind, e);
  }
  const dropOptional = adherence < 0.5;
  if (dropOptional) notes.push("You completed under half of recent tasks, so optional blocks are paused to lighten the plan.");
  for (const [kind, { p, c }] of byKind) {
    if (p >= 60 && c / p < 0.5) {
      emphasis[kind] = 1.25;
      notes.push(`${kind} tasks are lagging, so they get more time.`);
    }
  }
  if (notes.length === 0) notes.push("You are on track. The plan stays as it is.");
  return { dropOptional, emphasis, adherence, notes };
}

export function describePlanWindow(from: ISODate, deadline: ISODate, studyDays: number[], dailyMinutes: number) {
  const days = studyDatesBetween(from, deadline, studyDays);
  return { studyDays: days.length, totalMinutes: days.length * dailyMinutes };
}
