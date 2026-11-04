import { ArrowRight, BookMarked, Briefcase, Code2, Cpu, ListChecks, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PRICING } from "@/config/plans";

const STEPS = [
  "Create a free account and tell us your target role.",
  "Open a checklist, solve on the original site, and tick the problem off here.",
  "Plan each day in Daily Sprint and watch your dashboard fill with real progress.",
];

function Orbit() {
  return (
    <svg viewBox="0 0 520 520" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#5689FF" stopOpacity="0.55" /><stop offset="100%" stopColor="#5689FF" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="260" cy="260" r="250" fill="url(#g)" opacity="0.5" />
      {[90, 150, 210, 250].map((r, i) => <circle key={r} cx="260" cy="260" r={r} fill="none" stroke="#5689FF" strokeOpacity={0.5 - i * 0.1} strokeWidth="1" strokeDasharray={i % 2 ? "2 7" : undefined} />)}
      <path d="M60 330 A210 210 0 0 1 330 62" fill="none" stroke="#5689FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="330" cy="62" r="7" fill="#5689FF" /><circle cx="330" cy="62" r="16" fill="#5689FF" opacity="0.25" />
      <circle cx="260" cy="260" r="5" fill="#fff" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-grid" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" aria-hidden />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Site">
          <Link href="/pricing" className="hidden px-3 py-2 text-sm text-muted transition hover:text-white sm:block">Plans</Link>
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="eyebrow mb-6">Placement prep for engineering students</p>
            <h1 className="display text-[3.4rem] sm:text-7xl lg:text-[6.25rem]">
              Your <span className="text-accent">next move</span> starts here.
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
              Practise DSA, take scored CS mocks and turn the questions you miss into your next revision session. Keep your placement prep and applications in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/register" className="btn-glow group px-7 py-3.5 text-base">Start free<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link>
              <Link href="/try" className="btn-ghost px-7 py-3.5 text-base">Try a mini mock</Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"><Orbit /></div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-32 sm:px-6" aria-labelledby="inside">
          <p className="eyebrow mb-3">What&apos;s inside</p>
          <h2 id="inside" className="display mb-12 max-w-2xl text-4xl sm:text-6xl">Everything you <span className="text-accent">tick off</span>, in one place.</h2>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="card hover-card md:col-span-4 md:row-span-2 flex flex-col justify-between !p-8">
              <Code2 className="h-6 w-6 text-accent" aria-hidden />
              <div className="mt-24">
                <h3 className="text-3xl">DSA <span className="text-accent">checklist</span></h3>
                <p className="mt-3 max-w-md text-muted">Work through your problem sheet topic by topic. Every problem links straight to LeetCode, GeeksforGeeks or wherever it lives.</p>
              </div>
            </div>
            <div className="card hover-card md:col-span-2"><Cpu className="mb-4 h-5 w-5 text-accent" aria-hidden /><h3 className="text-lg">Core CS</h3><p className="mt-2 text-sm text-muted">DBMS, OS, CN and OOP, each with its own progress bar.</p></div>
            <div className="card hover-card md:col-span-2"><ListChecks className="mb-4 h-5 w-5 text-accent" aria-hidden /><h3 className="text-lg">Daily Sprint</h3><p className="mt-2 text-sm text-muted">Write down today&apos;s plan. Missed tasks are one tap from today.</p></div>
            <div className="card hover-card md:col-span-2"><BookMarked className="mb-4 h-5 w-5 text-accent" aria-hidden /><h3 className="text-lg">Notes and bookmarks</h3><p className="mt-2 text-sm text-muted">Save your approach on any problem.</p></div>
            <div className="card hover-card md:col-span-2"><RotateCcw className="mb-4 h-5 w-5 text-accent" aria-hidden /><h3 className="text-lg">Revision flags</h3><p className="mt-2 text-sm text-muted">Mark it once, find it later in one list.</p></div>
            <div className="card hover-card md:col-span-2"><Briefcase className="mb-4 h-5 w-5 text-accent" aria-hidden /><h3 className="text-lg">Application tracker</h3><p className="mt-2 text-sm text-muted">Companies, roles and deadlines, wishlist to offer.</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-32 sm:px-6" aria-labelledby="how">
          <p className="eyebrow mb-3">How it works</p>
          <h2 id="how" className="display mb-12 text-4xl sm:text-6xl">Three steps. <span className="text-accent">No setup.</span></h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((t, i) => (
              <li key={t} className="card hover-card">
                <span className="text-6xl font-bold tracking-tighter text-accent">{i + 1}</span>
                <p className="mt-6 text-lg leading-snug">{t}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-32 sm:px-6" aria-labelledby="plans">
          <div className="card relative overflow-hidden !p-8 sm:!p-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-[100px]" aria-hidden />
            <p className="eyebrow mb-3">Plans</p>
            <h2 id="plans" className="display relative max-w-2xl text-4xl sm:text-6xl">Free to start. <span className="text-accent">Pro</span> from ₹{PRICING[0].price}.</h2>
            <p className="relative mt-5 max-w-lg text-muted">Checklists, notes and bookmarks are free. Pro passes are fixed-term and never renew on their own.</p>
            <Link href="/pricing" className="btn-ghost relative mt-8">Compare Free and Pro</Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-line py-10 text-center text-sm text-muted">Fast Sprint</footer>
    </div>
  );
}
