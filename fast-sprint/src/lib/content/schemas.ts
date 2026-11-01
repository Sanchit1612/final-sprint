import { z } from "zod";

const difficulty = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.enum(["easy", "medium", "hard"]),
);
const str = z.string().trim().min(1);
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const tags = z.array(z.string().trim().min(1)).optional();

export const RESOURCE_KINDS = ["video", "playlist", "article", "pdf", "notes", "docs", "course", "practice", "other"] as const;

export const resourceRef = z.object({
  title: str,
  url: z.string().trim().url(),
  kind: z.enum(RESOURCE_KINDS).optional(),
  provider: optStr,
  durationMinutes: z.number().int().positive().optional(),
  description: optStr,
  tags,
});

export const dsaFile = z.object({
  subject: z.string().optional(),
  topics: z.array(z.object({
    id: str,
    title: str,
    description: optStr,
    resources: z.array(resourceRef).optional(),
    problems: z.array(z.object({
      id: str,
      title: str,
      difficulty: difficulty.optional(),
      link: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
      resource: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
      platform: optStr,
      tags,
      companies: tags,
    })),
  })).min(1),
});

export const coreFile = z.object({
  subject: str, // dbms | os | cn | oop (or any core_subjects.slug)
  topics: z.array(z.object({ id: str, title: str, summary: optStr, resources: z.array(resourceRef).optional() })).min(1),
});

export const roadmapFile = z.object({
  track: str, // full-stack | machine-learning | ai-llm (or any development_tracks.slug)
  milestones: z.array(z.object({
    id: str,
    title: str,
    description: optStr,
    estimatedHours: z.number().positive().optional(),
    items: z.array(z.union([str, z.object({ id: str.optional(), title: str })])).optional(),
    resources: z.array(resourceRef).optional(),
  })).min(1),
});

export const quizFile = z.object({
  domain: z.enum(["aptitude", "core_cs"]).optional(),
  id: optStr,            // quiz slug; derived from topic when omitted
  topic: optStr,         // aptitude: topic name. core_cs: core topic slug
  subject: optStr,       // core_cs: core subject slug
  category: optStr,      // aptitude category, e.g. "Quantitative". Defaults to "General"
  title: optStr,
  description: optStr,
  difficulty: difficulty.optional(),
  timeLimitMinutes: z.number().positive().optional(),
  isPro: z.boolean().optional(),
  questions: z.array(z.object({
    id: str,
    q: str,
    options: z.array(str).min(2).max(8),
    answer: z.number().int().min(0), // 0-based index into options
    explanation: optStr,
    difficulty: difficulty.optional(),
  }).refine((q) => q.answer < q.options.length, { message: "answer must be a valid 0-based option index" })).min(1),
});

export const interviewFile = z.object({
  category: z.enum(["hr", "behavioural", "technical"]),
  questions: z.array(z.object({
    id: str,
    q: str,
    guidance: optStr,
    topic: optStr,
    company: optStr,
    difficulty: difficulty.optional(),
    tags,
  })).min(1),
});

// Company question packs (technical interview questions tagged with a company)
export const companyFile = z.object({
  company: str,
  pattern: optStr,
  questions: z.array(z.object({ id: str, type: optStr, title: str, details: optStr, source: optStr })).min(1),
});

export const attachTarget = z.object({
  type: z.enum(["dsa_topic", "dsa_problem", "core_topic", "roadmap_milestone", "interview_question", "quiz"]),
  // dsa_topic: "arrays" | dsa_problem: "arrays/two-sum" | core_topic: "dbms/normalization"
  // roadmap_milestone: "full-stack/html" | interview_question: "hr/q1" | quiz: "quiz-slug"
  ref: str,
});
export const resourcesFile = z.object({
  resources: z.array(resourceRef.extend({ attachTo: z.array(attachTarget).optional() })).min(1),
});

export const CONTENT_KINDS = ["dsa", "core", "roadmap", "quiz", "interview", "resources"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const schemaByKind = {
  dsa: dsaFile, core: coreFile, roadmap: roadmapFile, quiz: quizFile, interview: z.union([interviewFile, companyFile]), resources: resourcesFile,
} as const;

export type DsaFile = z.infer<typeof dsaFile>;
export type CoreFile = z.infer<typeof coreFile>;
export type RoadmapFile = z.infer<typeof roadmapFile>;
export type QuizFile = z.infer<typeof quizFile>;
export type InterviewFile = z.infer<typeof interviewFile>;
export type CompanyFile = z.infer<typeof companyFile>;
export type ResourcesFile = z.infer<typeof resourcesFile>;
export type ResourceRef = z.infer<typeof resourceRef>;
