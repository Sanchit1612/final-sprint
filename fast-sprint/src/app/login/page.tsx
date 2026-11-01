import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { SetupRequired } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in" };
export default function Page() {
  if (!supabaseConfigured()) return <SetupRequired />;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="flex w-full flex-col items-center gap-8"><Logo /><Suspense><AuthForm mode="login" /></Suspense></div>
    </main>
  );
}
