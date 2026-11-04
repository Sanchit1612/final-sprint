import Link from "next/link";
import { Logo } from "@/components/Logo";
import { bank } from "@/lib/assessment/bank";

export const metadata = { title: "Try a CS mini mock" };

export default function Page() {
  const questions = (["dbms", "os", "cn", "oop"] as const).map(subject =>
    bank.find(question => question.subject === subject && question.difficulty === "medium")!
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Logo />
      <h1 className="mt-8 text-3xl font-bold">Try a CS mini mock</h1>
      <p className="my-4 text-muted">Four interview practice questions. Choose an answer, then check the reasoning. No account needed.</p>
      {questions.map((question, index) => (
        <section key={question.id} className="card mb-4">
          <p className="mb-2 text-xs uppercase text-accent">{question.subject} · {question.difficulty}</p>
          <h2 className="font-semibold">{index + 1}. {question.question}</h2>
          <fieldset className="my-4 space-y-2">
            <legend className="sr-only">Answer for question {index + 1}</legend>
            {question.options.map((_, offset) => (question.correct + index + 1 + offset) % question.options.length).map(optionIndex => (
              <label key={optionIndex} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3">
                <input type="radio" name={question.id} value={optionIndex} />
                {question.options[optionIndex]}
              </label>
            ))}
          </fieldset>
          <details>
            <summary className="cursor-pointer text-accent">Check answer</summary>
            <p className="mt-3 font-semibold">{question.options[question.correct]}</p>
            <p className="mt-1 text-muted">{question.explanation}</p>
          </details>
        </section>
      ))}
      <Link href="/register?next=%2Fpractice" className="btn-primary">Start a free scored mock</Link>
      <Link href="/system-design" className="btn-ghost ml-2">Explore the LLD roadmap</Link>
    </main>
  );
}
