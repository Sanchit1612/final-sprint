import type { ISODate } from "../dates";

export type TaskKind = "dsa" | "core" | "roadmap" | "aptitude" | "interview" | "revision" | "review" | "custom";
export type Level = "beginner" | "intermediate" | "advanced";
export type Phase = "build" | "practice" | "final";

export interface TaskTemplate {
  key: string;
  kind: TaskKind;
  title: string;
  description?: string;
  /** Smallest block worth scheduling, in minutes. Templates that would get less are dropped for that day. */
  minMinutes: number;
  /** Relative share of a day's time (daily templates). */
  baseWeight: number;
  phaseWeights: Record<Phase, number>;
  levelMultipliers: Record<Level, number>;
  /** Only scheduled when the user picked a development track. */
  requiresTrack?: boolean;
  /** Dropped first when the learner is falling behind. */
  optional?: boolean;
  /** weekly = fixed block on the last study day of each week. */
  cadence: "daily" | "weekly";
  /** Fixed block length for weekly templates. */
  fixedMinutes?: number;
  /** Where the task opens when there is no specific focus item. */
  defaultHref: string;
}

export interface FocusItem {
  id: string;
  title: string;
  href: string;
  entityType: string;
}

export type FocusPools = Partial<Record<TaskKind, FocusItem[]>>;

export interface Adjustments {
  dropOptional: boolean;
  /** Multipliers per kind (1 = unchanged). */
  emphasis: Partial<Record<TaskKind, number>>;
}

export interface ScheduleInput {
  /** First day of the whole plan (drives phases). */
  planStart: ISODate;
  /** First day to generate tasks for (today when regenerating). */
  from: ISODate;
  deadline: ISODate;
  studyDays: number[];
  dailyMinutes: number;
  level: Level;
  hasTrack: boolean;
  templates: TaskTemplate[];
  /** Per-plan switches: { [templateKey]: { enabled?: boolean } } */
  overrides?: Record<string, { enabled?: boolean }>;
  pools?: FocusPools;
  /** Where each kind's rotation should resume (e.g. number already completed). */
  focusOffsets?: Partial<Record<TaskKind, number>>;
  adjustments?: Adjustments;
}

export interface GeneratedTask {
  scheduledDate: ISODate;
  kind: TaskKind;
  templateKey: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  entityType: string | null;
  entityId: string | null;
  href: string;
  sortOrder: number;
}

export interface TaskLite {
  id: string;
  scheduledDate: ISODate;
  estimatedMinutes: number;
  sortOrder: number;
  kind?: TaskKind;
  status?: "pending" | "completed" | "skipped";
}
