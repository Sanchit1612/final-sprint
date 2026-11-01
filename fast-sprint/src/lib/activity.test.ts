import {expect,it} from "vitest";
import {activitySummary,calendarDays,shiftMonth,completionTrends} from "./activity";
it("handles timezone midnight, yesterday grace and disjoint longest streak",()=>{
 const s=activitySummary(['2026-10-31T20:00:00Z','2026-10-30T20:00:00Z','2026-10-28T20:00:00Z','invalid','2027-01-01'], 'Asia/Kolkata',new Date('2026-11-02T04:00:00Z'));
 expect(s.current).toBe(2);expect(s.longest).toBe(2);expect(s.days['2026-11-01']).toBe(1);
});
it("navigates year boundaries and leap February automatically",()=>{
 expect(shiftMonth('2026-12',1)).toBe('2027-01');expect(shiftMonth('2026-01',-1)).toBe('2025-12');
 const d=calendarDays('2028-02');expect(d).toHaveLength(42);expect(d).toContain('2028-02-29');
 expect(new Date(d[0]+'T00:00:00Z').getUTCDay()).toBe(0);
});
it("counts completions without counting future records or inventing activity",()=>{
 const s=activitySummary([], 'UTC',new Date('2026-11-01'));expect(s.current).toBe(0);expect(s.longest).toBe(0);expect(s.days).toEqual({});
});

it("aggregates Monday-based weeks and month boundaries without future data",()=>{
 const t=completionTrends({"2026-10-31":2,"2026-11-01":3,"2026-11-02":99},"2026-11-01");
 expect(t.weekly.at(-1)).toEqual({start:"2026-10-26",completions:5});
 expect(t.monthly.at(-1)).toEqual({month:"2026-11",completions:3});
 expect(t.monthly.at(-2)).toEqual({month:"2026-10",completions:2});
});
