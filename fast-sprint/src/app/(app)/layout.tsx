import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SetupRequired } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured()) return <SetupRequired />;
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.profile?.onboarded_at) redirect("/onboarding");
  return <AppShell name={s.profile.full_name ?? s.user.email ?? ""} isPro={s.isPro}>{children}</AppShell>;
}
