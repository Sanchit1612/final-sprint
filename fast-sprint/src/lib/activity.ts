import { addDays, diffDays, todayIn } from "./dates";
export function activitySummary(timestamps: string[], timezone: string, now = new Date()) {
  const today = todayIn(timezone, now), days: Record<string, number> = {};
  for (const stamp of timestamps) {
    const date = new Date(stamp);
    if (!Number.isFinite(date.getTime()) || date > now) continue;
    const day = todayIn(timezone, date); days[day] = (days[day] ?? 0) + 1;
  }
  let current = 0;
  for (let d = days[today] ? today : addDays(today, -1); days[d]; d = addDays(d, -1)) current++;
  let longest = 0, run = 0, prev: string | null = null;
  for (const d of Object.keys(days).sort()) { run = prev && diffDays(prev, d) === 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = d; }
  return { today, days, current, longest };
}
export function calendarDays(month: string) {
  const first = `${month}-01`, start = addDays(first, -new Date(`${first}T00:00:00Z`).getUTCDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + delta); return d.toISOString().slice(0,7);
}
export function completionTrends(days: Record<string, number>, today: string) {
  const monday = addDays(today, -(new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7);
  const weekly = Array.from({length:8},(_,i)=>{
    const start=addDays(monday,(i-7)*7),end=addDays(start,6);
    return {start,completions:Object.entries(days).filter(([d])=>d>=start&&d<=end&&d<=today).reduce((n,[,v])=>n+v,0)};
  });
  const monthly=Array.from({length:6},(_,i)=>{
    const month=shiftMonth(today.slice(0,7),i-5);
    return {month,completions:Object.entries(days).filter(([d])=>d.startsWith(month)&&d<=today).reduce((n,[,v])=>n+v,0)};
  });
  return {weekly,monthly};
}
