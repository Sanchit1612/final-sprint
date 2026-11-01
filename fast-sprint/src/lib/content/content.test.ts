import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { importAll } from "./import";
import { urlKey } from "./normalize";

describe("csv", () => {
  it("handles quotes, commas and newlines", () => {
    const rows = parseCsv('a,b\n"x, y","say ""hi"""\n"line1\nline2",z\n');
    expect(rows).toEqual([{ a: "x, y", b: 'say "hi"' }, { a: "line1\nline2", b: "z" }]);
  });
});
describe("urlKey", () => {
  it("normalises equivalent URLs", () => {
    expect(urlKey("https://www.Example.com/a/b/?utm_source=x#frag")).toBe(urlKey("https://example.com/a/b"));
  });
});
describe("importAll (dry run)", () => {
  it("accepts the original DSA sample format and counts rows", async () => {
    const r = await importAll(null, [
      { name: "dsa.json", kind: "dsa", format: "json", text: JSON.stringify({ subject: "dsa", topics: [{ id: "a", title: "A", problems: [{ id: "p1", title: "P1", difficulty: "Easy", link: "https://x.com/p1", resource: "" }] }] }) },
      { name: "os.json", kind: "core", format: "json", text: JSON.stringify({ subject: "os", topics: [{ id: "t", title: "T" }] }) },
    ], { dryRun: true });
    expect(r.errors).toEqual([]);
    expect(r.counts).toMatchObject({ problems: 1, topics: 2 });
  });
  it("skips later-phase kinds with a warning instead of failing", async () => {
    const r = await importAll(null, [{ name: "q.json", kind: "quiz", format: "json", text: "{}" }], { dryRun: true });
    expect(r.errors).toEqual([]);
    expect(r.warnings[0]).toContain("later phase");
  });
  it("reports invalid rows and same-URL problems", async () => {
    const r = await importAll(null, [
      { name: "bad.json", kind: "dsa", format: "json", text: JSON.stringify({ topics: [{ id: "a", title: "A", problems: [{ id: "x", difficulty: "impossible" }] }] }) },
      { name: "d.csv", kind: "dsa", format: "csv", text: "topic_id,topic_title,problem_id,title,difficulty,url\na,A,1,One,easy,https://x.com/p\nb,B,2,Two,hard,https://www.x.com/p/\n" },
    ], { dryRun: true });
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => w.includes("same URL"))).toBe(true);
  });
});
