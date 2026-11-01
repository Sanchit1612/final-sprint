/** Free vs Pro. Prices are PROPOSED launch prices to validate with students; payments are not live yet. */
export const PRICING = [
  { months: 1, price: 89, label: "1 month", tagline: "Try it for a month" },
  { months: 3, price: 219, label: "3 months", tagline: "One placement season", popular: true },
  { months: 6, price: 399, label: "6 months", tagline: "Prepare without a deadline rush" },
] as const;

export interface Feature { name: string; free: string | boolean; pro: string | boolean; available: boolean }

/** `available: false` = on the roadmap, not built yet (shown honestly as "coming soon"). */
export const FEATURES: Feature[] = [
  { name: "DSA and Core CS checklists", free: true, pro: true, available: true },
  { name: "Progress tracking, notes and bookmarks", free: true, pro: true, available: true },
  { name: "Daily Sprint task list", free: "5 tasks per day", pro: "Unlimited", available: true },
  { name: "Application tracker", free: "10 applications", pro: "Unlimited", available: true },
  { name: "200 Most Important Problems, A2Z and NeetCode 150", free: true, pro: true, available: false },
  { name: "Aptitude preparation packs", free: false, pro: true, available: false },
  { name: "Behavioural and HR preparation packs", free: false, pro: true, available: false },
  { name: "Company preparation packs", free: false, pro: true, available: false },
  { name: "Personalised Placement Mode", free: false, pro: true, available: false },
  { name: "Spaced repetition and revision tools", free: false, pro: true, available: false },
  { name: "Company-specific mocks and readiness reports", free: false, pro: true, available: false },
  { name: "Advanced analytics", free: false, pro: true, available: false },
  { name: "Expanded technical interview collections", free: false, pro: true, available: false },
];

export interface Entitlement { plan: string; status: string; starts_at: string; expires_at: string | null }
export function isProActive(e: Entitlement | null | undefined, now = new Date()): boolean {
  if (!e || e.plan !== "pro" || e.status !== "active") return false;
  const start = new Date(e.starts_at).getTime();
  const expiry = e.expires_at ? new Date(e.expires_at).getTime() : Infinity;
  return Number.isFinite(start) && start <= now.getTime() && expiry > now.getTime();
}
