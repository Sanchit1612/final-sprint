import { z } from "zod";
import { isISODate } from "./dates";

const blankToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const APP_STATUSES = ["wishlist", "applied", "online_assessment", "interview", "offer", "rejected", "withdrawn"] as const;
export const applicationSchema = z.object({
  company: z.string().trim().min(1, "Enter a company").max(120),
  role: z.string().trim().min(1, "Enter a role").max(120),
  status: z.enum(APP_STATUSES),
  applied_on: z.preprocess(blankToUndef, z.string().refine(isISODate, "Use a valid date").optional()),
  deadline: z.preprocess(blankToUndef, z.string().refine(isISODate, "Use a valid date").optional()),
  job_url: z.preprocess(blankToUndef, z.string().url("Enter a full link starting with https://").optional()),
  notes: z.preprocess(blankToUndef, z.string().max(1000).optional()),
});
export type ApplicationInput = z.input<typeof applicationSchema>;

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name").max(100),
  college: z.preprocess(blankToUndef, z.string().max(150).optional()),
  branch: z.preprocess(blankToUndef, z.string().max(100).optional()),
  graduation_year: z.preprocess((v) => (v === "" || v == null || Number.isNaN(v) ? undefined : Number(v)), z.number().int().min(2000).max(2100).optional()),
  target_role: z.preprocess(blankToUndef, z.string().max(100).optional()),
  target_company: z.preprocess(blankToUndef, z.string().max(100).optional()),
  timezone: z.string().max(60).refine(v => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }, "Choose a valid timezone").optional(),
});
export type ProfileInput = z.input<typeof profileSchema>;
