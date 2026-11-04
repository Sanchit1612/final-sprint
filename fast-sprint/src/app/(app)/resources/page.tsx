import Link from "next/link";
import { LIBRARY } from "@/config/library";
import { LockedFeatures } from "@/components/LockedFeatures";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { studyPaths } from "@/lib/content/library-paths";

const practice = [
  ["/dsa", "DSA problem sheets", "Work through interview problems by pattern and flag questions to revisit."],
  ["/practice", "CS mock practice", "Test one subject or mix topics, then review the explanations."],
  ["/sql-practice", "SQL practice", "Write queries for 20 exercises and compare with tested PostgreSQL solutions."],
  ["/system-design", "System design & LLD", "Work through 12 lessons with design exercises and walkthroughs."],
];

const proDescriptions: Record<string, string> = {
  aptitude: "Practise percentages, rates and probability with worked reasoning.",
  behavioural: "Build a story bank and rehearse follow-up questions from real experiences.",
  interview: "Explain fundamentals aloud and work through technical interview scenarios.",
  companies: "Focus on priority DSA questions for a target company and track your progress.",
  development: "Turn frontend and backend concepts into a project you can demonstrate.",
};

export default async function Page() {
  const { isPro } = await requireSession();
  const pro = LIBRARY.filter(category => category.pro);
  return (
    <>
      <PageHeader title="Your preparation library" subtitle="Pick a topic to learn, try it in practice, then review what you missed." />
      <section className="mb-6" aria-labelledby="practice-library">
        <h2 id="practice-library" className="mb-3 text-xl">Start practising</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {practice.map(([href, title, description]) => (
            <Link key={href} href={href} className="card hover-card">
              <h3 className="text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="core-library">
        <h2 id="core-library" className="mb-3 text-xl">Core CS · Free</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LIBRARY.filter(category => !category.pro).map(category => (
            <Link key={category.slug} href={`/resources/${category.slug}`} className="card hover-card">
              <h3 className="text-lg">{category.title}</h3>
              <p className="mt-2 text-sm text-muted">{studyPaths[category.slug].steps.join(" → ")}</p>
            </Link>
          ))}
        </div>
      </section>
      {isPro ? (
        <section className="mt-6" aria-labelledby="pro-library">
          <h2 id="pro-library" className="mb-3 text-xl">Placement preparation · Pro</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pro.map(category => (
              <Link key={category.slug} href={`/resources/${category.slug}`} className="card hover-card">
                <h3 className="text-lg">{category.title}</h3>
                <p className="mt-2 text-sm text-muted">{proDescriptions[category.slug]}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : <LockedFeatures features={pro.map(category => [category.title, proDescriptions[category.slug]] as const)} />}
    </>
  );
}
