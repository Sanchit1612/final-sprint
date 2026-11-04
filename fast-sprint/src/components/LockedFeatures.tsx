import Link from "next/link";

export function LockedFeatures({ features }: { features: readonly (readonly [string, string])[] }) {
  return (
    <section aria-label="Locked Pro features" className="my-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg">Preview Pro</h2>
        <Link href="/pricing" className="text-sm text-accent">Explore Pro →</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map(([title, description]) => (
          <article key={title} className="card !p-4">
            <p className="text-xs text-accent">Locked · Pro</p>
            <h3 className="mt-1 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
