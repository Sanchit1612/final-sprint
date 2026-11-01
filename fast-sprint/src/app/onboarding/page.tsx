import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ProfileForm } from "@/components/ProfileForm";
import { SetupRequired } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome" };
export default async function Page() {
  if (!supabaseConfigured()) return <SetupRequired />;
  const { profile, user } = await requireSession();
  if (profile?.onboarded_at) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Logo href="/dashboard" />
      <h1 className="mt-10 text-3xl">Set up your sprint</h1>
      <p className="mt-2 text-sm text-muted">A few details so your dashboard shows your goal. You can change these later in Settings.</p>
      <div className="card mt-6">
        <ProfileForm onboarding initial={{
          full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "", college: profile?.college ?? "", branch: profile?.branch ?? "",
          graduation_year: profile?.graduation_year ? String(profile.graduation_year) : "", target_role: profile?.target_role ?? "", target_company: profile?.target_company ?? "",
        }} />
      </div>
    </main>
  );
}
