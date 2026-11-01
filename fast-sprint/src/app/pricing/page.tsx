import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PricingCards } from "@/components/PricingCards";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plans" };

export default async function Page() {
  const s = await getSession();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo href={s ? "/dashboard" : "/"} />
        {s ? <Link href="/dashboard" className="btn-ghost">Dashboard</Link> : <Link href="/login" className="btn-ghost">Log in</Link>}
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="display max-w-3xl text-5xl sm:text-6xl">A small price.<br />A <span className="text-accent">serious next step</span>.</h1>
        <p className="mb-10 mt-3 max-w-xl text-muted">Think coffee money, invested in your placement preparation. Start free; choose a fixed-term Pro pass when its features fit your needs. No auto-renewal.</p>
        <PricingCards isPro={s?.isPro ?? false} signedIn={!!s} />
      </main>
    </div>
  );
}
