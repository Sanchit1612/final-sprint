import Link from "next/link";
import { assessmentsEnabled, subjects } from "@/lib/assessment/bank";
import { studyPaths, topicReading } from "@/lib/content/library-paths";
import { PracticeExercise } from "./PracticeExercise";

export function LibraryStudyPath({ slug }: { slug: string }) {
  const path = studyPaths[slug];
  if (!path) return null;
  const subject = slug === "sql" ? "dbms" : slug;
  const hasMock = subjects.some(value => value !== "mixed" && value === subject);
  const options = path.choices.map((text, index) => ({ id: String.fromCharCode(97 + index), text }));

  return (
    <section className="card mb-5">
      <h2 className="text-lg font-semibold">Study path</h2>
      <ol className="my-3 list-decimal space-y-1 pl-5 text-sm text-muted">
        {path.steps.map((step, index) => {
          const reading = topicReading[slug]?.[index];
          return (
            <li key={step} className="pb-2">
              <span className="font-medium text-white">{step}</span>
              {reading?.task && <p className="mt-1">{reading.task}</p>}
              {reading && (
                <a className="mt-1 block text-accent hover:underline" href={reading.href} target="_blank" rel="noopener noreferrer">
                  {reading.label} ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>
      <h3 className="mt-4 font-semibold">Try it yourself</h3>
      <PracticeExercise key={slug} data={{
        question: path.challenge,
        options,
        correctOptions: [options[path.correct].id],
        acceptedText: [],
        answer: path.choices[path.correct],
        explanation: path.walkthrough,
        assumption: "",
        sourceLabel: "Fast Sprint practice",
      }} />
      {hasMock && assessmentsEnabled() && (
        <Link className="btn-primary mt-4" href={`/practice?subject=${subject}`}>
          {slug === "sql" ? "Take a related DBMS mock · 10 questions" : "Take a subject mock · 10 questions"}
        </Link>
      )}
      {slug === "sql" && <Link className="btn-ghost mt-4" href="/sql-practice">Practise SQL queries</Link>}
    </section>
  );
}
