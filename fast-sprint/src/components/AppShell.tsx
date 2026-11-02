"use client";

import { BookMarked, Briefcase, Code2, Cpu, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";

const NAV = [
  {href:"/companies",label:"Company-wise DSA",icon:Briefcase},
  { href: "/resources", label: "Resource library", icon: BookMarked },
  { href: "/analytics", label: "Analytics", icon: LayoutDashboard },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dsa", label: "DSA", icon: Code2 },
  { href: "/core", label: "Core CS", icon: Cpu },
  { href: "/sprint", label: "Daily Sprint", icon: ListChecks },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/saved", label: "Saved", icon: BookMarked },
];
const NAV_BOTTOM = [
  { href: "/pricing", label: "Plans", icon: Sparkles },
  { href: "/billing", label: "Payment history", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ name, isPro, children }: { name: string; isPro: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const link = ({ href, label, icon: Icon }: (typeof NAV)[number]) => {
    const active = path === href || path.startsWith(`${href}/`);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-white/5 hover:text-white"}`}>
        <Icon className="h-4 w-4" aria-hidden />{label}
      </Link>
    );
  };

  const sidebar = (
    <nav aria-label="Main" className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <div className="mb-6 px-1"><Logo href="/dashboard" /></div>
      {NAV.filter(n=>n.href!=="/core").map(link)}
      <details className="rounded-xl" open={path.startsWith("/core")||["dbms","os","cn","oop","sql"].some(s=>path===`/resources/${s}`)}><summary className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-muted"><Cpu className="h-4 w-4" aria-hidden/>CS concepts</summary><div className="ml-5 space-y-1 border-l border-line pl-2">{[{href:"/core",label:"All CS concepts",icon:Cpu},...[["dbms","DBMS"],["os","Operating Systems"],["cn","Computer Networks"],["oop","OOP"],["sql","SQL"]].map(([key,label])=>({href:`/resources/${key}`,label,icon:Cpu}))].map(link)}</div></details>
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        {NAV_BOTTOM.map(link)}
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" aria-hidden />Log out</button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r border-line bg-surface">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/5 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <Link href="/pricing" className={`chip ${isPro ? "border-accent/50 text-accent" : ""}`}>{isPro ? "Pro" : "Free plan"}</Link>
          <Link href="/settings" className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold" aria-label="Settings">{(name || "?").charAt(0).toUpperCase()}</Link>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
