import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SetupRequired } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { getSession } from "@/lib/session";
import {learningSyncEnabled} from '@/lib/learning-sync';
import {LearningSyncBridge} from '@/components/LearningSyncBridge';

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured()) return <SetupRequired />;
  const s = await getSession();
  if (!s) return <AppShell name="Guest" isPro={false} guest>{children}</AppShell>;
  if (!s.profile?.onboarded_at) redirect("/onboarding");
  return <AppShell name={s.profile.full_name ?? s.user.email ?? ""} isPro={s.isPro}>{learningSyncEnabled()&&<LearningSyncBridge user={s.user.id}/>} {children}</AppShell>;
}
