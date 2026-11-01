import Link from "next/link";
/** Only intentionally public headings enter this component. Blurred bars contain no protected data. */
export function ProPreview({ headings, title, description }: { headings: readonly string[]; title: string; description: string }) {
 return <section className="card my-5" aria-label={`${title} preview`}>
  <p className="eyebrow">A look inside Pro</p><h2 className="mt-2 text-xl">{title}</h2>
  <div className="mt-4 space-y-4">
   <ol className="grid gap-3 sm:grid-cols-3">{headings.slice(0,3).map((h,i)=><li key={h} className="flex gap-3 text-sm"><span className="font-semibold text-accent">0{i+1}</span><span>{h}</span></li>)}</ol>
   <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 p-4">
    <div aria-hidden className="pointer-events-none absolute inset-4 select-none space-y-4 blur-sm opacity-25">{[1,2,3].map(n=><div key={n} className="h-4 rounded-full bg-white/20" style={{width:`${95-n*12}%`}}/>)}</div>
    <div className="relative"><h3 className="text-base">Make your next step clearer</h3><p className="mt-2 text-sm text-muted">{description}</p><Link className="btn-primary mt-3" href="/pricing">Explore Pro</Link></div>
   </div>
  </div>
 </section>;
}
