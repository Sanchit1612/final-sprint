import Link from "next/link";
import { billingAdmin } from "@/lib/billing/server";
import { assessmentsEnabled, type Question } from "@/lib/assessment/bank";

type TopicStats = {
  total: number;
  correct: number;
  mocksSeen: number;
  mocksMissed: number;
  missedInLatestMock: boolean;
  latestMissedQuestion?: string;
};

export async function AssessmentInsights({ user }: { user: string }) {
  if (!assessmentsEnabled()) return (
    <section className="card mt-5">
      <h2 className="text-xl">Blind Spot Radar</h2>
      <p className="mt-2 text-sm text-muted">Mock analytics is unavailable in this environment.</p>
    </section>
  );

  const { data, error } = await billingAdmin()
    .from("quiz_attempts")
    .select("questions,answers")
    .eq("user_id", user)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);
  if (error) throw new Error("Could not load assessment insights");

  const attempts = data ?? [];
  const groups = new Map<string, TopicStats>();
  for (const attempt of attempts) {
    const topicsInMock = new Map<string, { total: number; correct: number; missedQuestion?: string }>();
    for (const [index, question] of (attempt.questions as Question[]).entries()) {
      const topic = `${question.subject.toUpperCase()} · ${question.topic ?? "Fundamentals"}`;
      const result = topicsInMock.get(topic) ?? { total: 0, correct: 0 };
      result.total++;
      if (attempt.answers[index] === question.correct) result.correct++;
      else result.missedQuestion ??= question.question;
      topicsInMock.set(topic, result);
    }

    for (const [topic, result] of topicsInMock) {
      const stats = groups.get(topic) ?? {
        total: 0,
        correct: 0,
        mocksSeen: 0,
        mocksMissed: 0,
        missedInLatestMock: result.correct < result.total,
        latestMissedQuestion: result.missedQuestion,
      };
      stats.total += result.total;
      stats.correct += result.correct;
      stats.mocksSeen++;
      if (result.correct < result.total) stats.mocksMissed++;
      groups.set(topic, stats);
    }
  }

  const recurring = [...groups]
    .filter(([, stats]) => stats.missedInLatestMock && stats.mocksMissed >= 2)
    .sort(([, a], [, b]) => b.mocksMissed - a.mocksMissed || (b.total - b.correct) - (a.total - a.correct));
  const priority = recurring[0];
  const rows = [...groups]
    .sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total || b.total - a.total)
    .slice(0, 6);

  return (
    <>
      <section className="card mt-5" aria-labelledby="blind-spot-radar">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="blind-spot-radar" className="text-xl">Blind Spot Radar</h2>
          <span className="chip text-accent">Pro</span>
        </div>
        <p className="mt-2 text-sm text-muted">Surfaces topics you missed or skipped in at least two separate mocks and still missed the last time they appeared.</p>
        {priority ? (
          <div className="mt-4 rounded-xl border border-accent/50 bg-accent-soft p-4">
            <p className="text-xs font-semibold text-accent">Revise this first</p>
            <h3 className="mt-1 font-semibold">{priority[0]}</h3>
            <p className="mt-1 text-sm text-muted">Gaps in {priority[1].mocksMissed} of {priority[1].mocksSeen} mocks covering this topic.</p>
            <p className="mt-3 text-sm">{priority[1].latestMissedQuestion}</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-accent" href="/practice">Open mock history and review mistakes →</Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {attempts.length === 0 ? "No submitted mock answers yet. Submit two mocks to start spotting recurring gaps." : attempts.length < 2 ? "Submit at least two mocks to look for recurring gaps." : "No recurring gaps meet this rule in your recent mocks."}
          </p>
        )}
      </section>
      <section className="card mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Where your mock answers need work</h2>
          <Link className="text-sm text-accent" href="/practice">Practise and review →</Link>
        </div>
        <p className="mt-2 text-sm text-muted">Last {attempts.length} submitted mocks. Incorrect and skipped answers count as gaps. Small samples are a revision signal.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map(([topic, stats]) => (
            <div className="rounded-xl border border-line p-3" key={topic}>
              <h3 className="text-sm">{topic}</h3>
              <p className="mt-2 font-bold text-accent">{stats.correct}/{stats.total} correct · {stats.total - stats.correct} to review</p>
              <p className="mt-1 text-xs text-muted">Open recent attempts and use “Review mistakes only” to revisit the explanations.</p>
            </div>
          ))}
        </div>
        {!rows.length && <p className="mt-4 text-sm text-muted">Complete a mock to get answer-based revision priorities here.</p>}
      </section>
    </>
  );
}
