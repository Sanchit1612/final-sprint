import { parseCsv } from "./csv";
import type { ContentKind } from "./schemas";

type Row = Record<string, string>;
const list = (s?: string) => (s ? s.split(";").map((x) => x.trim()).filter(Boolean) : undefined);
const num = (s?: string) => (s && !Number.isNaN(Number(s)) ? Number(s) : undefined);
const blank = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T;

function groupBy(rows: Row[], key: string) {
  const m = new Map<string, Row[]>();
  for (const r of rows) m.set(r[key], [...(m.get(r[key]) ?? []), r]);
  return m;
}

/** Convert a CSV file into the same object shape the JSON files use, so one validator serves both. */
export function csvToObjects(kind: ContentKind, text: string): unknown[] {
  const rows = parseCsv(text);
  switch (kind) {
    case "dsa": {
      const topics = [...groupBy(rows, "topic_id")].map(([id, rs]) => ({
        id, title: rs[0].topic_title || id,
        problems: rs.filter((r) => r.problem_id).map((r) => blank({
          id: r.problem_id, title: r.title, difficulty: r.difficulty || undefined, link: r.url || undefined,
          resource: r.resource_url || undefined, platform: r.platform, tags: list(r.tags), companies: list(r.companies),
        })),
      }));
      return [{ topics }];
    }
    case "core": {
      return [...groupBy(rows, "subject")].map(([subject, rs]) => ({
        subject, topics: rs.map((r) => blank({ id: r.topic_id, title: r.title, summary: r.summary })),
      }));
    }
    case "roadmap": {
      return [...groupBy(rows, "track")].map(([track, rs]) => ({
        track,
        milestones: [...groupBy(rs, "milestone_id")].map(([id, ms]) => blank({
          id, title: ms[0].milestone_title || id, description: ms[0].description, estimatedHours: num(ms[0].estimated_hours),
          items: ms.filter((m) => m.item_title).map((m) => blank({ id: m.item_id || undefined, title: m.item_title })),
        })),
      }));
    }
    case "quiz": {
      return [...groupBy(rows, "quiz_id")].map(([id, rs]) => blank({
        id, title: rs[0].quiz_title, domain: rs[0].domain || undefined, category: rs[0].category, subject: rs[0].subject,
        topic: rs[0].topic, timeLimitMinutes: num(rs[0].time_limit_minutes),
        questions: rs.map((r) => {
          const options = ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"].map((k) => r[k]).filter(Boolean);
          const letter = (r.answer || "").trim().toUpperCase();
          return blank({
            id: r.question_id, q: r.question, options, answer: "ABCDEF".indexOf(letter),
            explanation: r.explanation, difficulty: r.difficulty || undefined,
          });
        }),
      }));
    }
    case "interview": {
      return [...groupBy(rows, "category")].map(([category, rs]) => ({
        category,
        questions: rs.map((r) => blank({
          id: r.question_id, q: r.question, guidance: r.guidance, topic: r.topic, company: r.company,
          difficulty: r.difficulty || undefined, tags: list(r.tags),
        })),
      }));
    }
    case "resources": {
      return [{
        resources: rows.map((r) => blank({
          title: r.title, url: r.url, kind: r.kind || undefined, provider: r.provider, durationMinutes: num(r.duration_minutes),
          description: r.description, tags: list(r.tags),
          attachTo: list(r.attach_to)?.map((t) => {
            const i = t.indexOf(":");
            return { type: t.slice(0, i), ref: t.slice(i + 1) };
          }),
        })),
      }];
    }
  }
}
