import type { TaskTemplate } from "@/lib/schedule/types";

/**
 * Task templates drive Placement Mode. They contain NO educational content: each one describes a
 * kind of study block, how much of a day it should get, and how that changes with level and phase.
 * Specific targets (a DSA topic, a Core CS topic, a roadmap milestone…) are filled in from the
 * content you import. Edit weights here, or switch templates off per plan from the Placement page.
 *
 * Phases: build = first 40% of the plan window, practice = next 40%, final = last 20%.
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: "dsa-practice", kind: "dsa", title: "DSA practice", cadence: "daily",
    description: "Work through problems from your DSA topics.",
    minMinutes: 30, baseWeight: 40,
    phaseWeights: { build: 1, practice: 1.2, final: 0.9 },
    levelMultipliers: { beginner: 0.9, intermediate: 1, advanced: 1.15 },
    defaultHref: "/dsa",
  },
  {
    key: "core-cs", kind: "core", title: "Core CS study", cadence: "daily",
    description: "Study a DBMS, OS, CN or OOP topic.",
    minMinutes: 25, baseWeight: 22,
    phaseWeights: { build: 1.2, practice: 1, final: 0.7 },
    levelMultipliers: { beginner: 1.2, intermediate: 1, advanced: 0.8 },
    defaultHref: "/core",
  },
  {
    key: "dev-track", kind: "roadmap", title: "Development track", cadence: "daily",
    description: "Move through your roadmap milestones.",
    minMinutes: 30, baseWeight: 18, requiresTrack: true,
    phaseWeights: { build: 1.2, practice: 1, final: 0.5 },
    levelMultipliers: { beginner: 1, intermediate: 1, advanced: 1 },
    defaultHref: "/roadmaps",
  },
  {
    key: "aptitude", kind: "aptitude", title: "Aptitude practice", cadence: "daily",
    description: "Take a timed aptitude quiz.",
    minMinutes: 20, baseWeight: 12, optional: true,
    phaseWeights: { build: 0.8, practice: 1.1, final: 1.2 },
    levelMultipliers: { beginner: 1, intermediate: 1, advanced: 0.9 },
    defaultHref: "/aptitude",
  },
  {
    key: "interview-prep", kind: "interview", title: "Interview preparation", cadence: "daily",
    description: "Practise HR, behavioural or technical questions.",
    minMinutes: 20, baseWeight: 8, optional: true,
    phaseWeights: { build: 0.3, practice: 1, final: 2 },
    levelMultipliers: { beginner: 0.8, intermediate: 1, advanced: 1.2 },
    defaultHref: "/interview",
  },
  {
    key: "revision", kind: "revision", title: "Revision queue", cadence: "daily",
    description: "Clear the items that are due for revision.",
    minMinutes: 15, baseWeight: 14,
    phaseWeights: { build: 0.8, practice: 1.1, final: 1.4 },
    levelMultipliers: { beginner: 1, intermediate: 1, advanced: 1 },
    defaultHref: "/revision",
  },
  {
    key: "weekly-review", kind: "review", title: "Weekly review", cadence: "weekly", fixedMinutes: 30,
    description: "Check your analytics and fix the weakest area.",
    minMinutes: 30, baseWeight: 0,
    phaseWeights: { build: 1, practice: 1, final: 1 },
    levelMultipliers: { beginner: 1, intermediate: 1, advanced: 1 },
    defaultHref: "/analytics",
  },
];
