import { CheckoutButton } from "./CheckoutButton";
import { passValue } from "@/lib/pricing";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { FEATURES, PRICING } from "@/config/plans";

const cell = (v: string | boolean) =>
  v === true ? <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" /> : v === false ? <Minus className="mx-auto h-4 w-4 text-muted" aria-label="Not included" /> : <span className="text-sm">{v}</span>;

export function PricingCards({ isPro, signedIn, billing }: { isPro: boolean; signedIn: boolean; billing?: {ready:boolean;mode?:string} }) {
  return (
    <div className="space-y-12">
      <div className="grid gap-4 md:grid-cols-3">
        {PRICING.map((p) => { const value = passValue(p.price, p.months); return (
          <div key={p.months} className={`card hover-card ${"popular" in p && p.popular ? "border-accent/60 shadow-glow" : ""}`}>
            <p className="text-sm text-muted">Pro · {p.label}</p>
            <p className="mt-2 text-5xl font-bold tracking-tight text-accent">₹{p.price}<span className="ml-2 text-sm font-normal text-muted">total</span></p>
            <p className="mt-3 text-lg">₹{value.perMonth.toFixed(2)} <span className="text-sm text-muted">/ month equivalent</span></p>
            {value.savings > 0 && <p className="mt-2 text-xs text-accent">Save ₹{value.savings} ({value.savingPercent}%) versus {p.months} separate one-month passes.</p>}
            <p className="mt-1 text-sm text-muted">{p.tagline}. One-time pass, no auto-renew.</p>
            <CheckoutButton months={p.months} signedIn={signedIn} ready={billing?.ready??false} mode={billing?.mode}/>
          </div>
        ); })}
      </div>
      <p className="-mt-8 text-xs text-muted">Prices are proposed launch prices and may change before payments go live. Your progress is always kept if a Pro pass ends.</p>

      <div>
        <h2 className="mb-4 text-xl">Free vs Pro</h2>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="bg-surface text-sm text-muted"><tr><th className="px-4 py-3 font-medium">Feature</th><th className="w-32 px-4 py-3 text-center font-medium">Free</th><th className="w-32 px-4 py-3 text-center font-medium">Pro</th></tr></thead>
            <tbody className="divide-y divide-line">
              {FEATURES.map((f) => (
                <tr key={f.name}>
                  <td className="px-4 py-3 text-sm">{f.name}{!f.available && <span className="chip ml-2">Coming soon</span>}</td>
                  <td className="px-4 py-3 text-center">{cell(f.free)}</td>
                  <td className="px-4 py-3 text-center">{cell(f.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        {isPro ? <p className="text-sm text-muted">You have an active Pro plan.</p> : signedIn ? <Link href="/billing" className="btn-ghost">View payment history</Link> : <Link href="/register" className="btn-glow">Start free</Link>}
      </div>
    </div>
  );
}
