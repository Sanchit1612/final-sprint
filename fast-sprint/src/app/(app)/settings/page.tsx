import Link from "next/link";
import { signOut } from "@/app/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { PageHeader } from "@/components/ui";
import { formatDay } from "@/lib/dates";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function Page() {
  const { profile, user, isPro, entitlement } = await requireSession();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="mb-4 text-lg">Profile and goal</h2>
          <ProfileForm initial={{
            full_name: profile?.full_name ?? "", college: profile?.college ?? "", branch: profile?.branch ?? "",
            graduation_year: profile?.graduation_year ? String(profile.graduation_year) : "", target_role: profile?.target_role ?? "", target_company: profile?.target_company ?? "",
          }} />
        </section>
        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-1 text-lg">Plan</h2>
            <p className="text-sm">{isPro ? "Pro" : "Free"}{isPro && entitlement?.expires_at ? <span className="text-muted"> · until {formatDay(entitlement.expires_at.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}</span> : null}</p>
            <Link href="/pricing" className="btn-ghost mt-4">{isPro ? "View plans" : "Compare plans"}</Link>
          </section>
          <section className="card">
            <h2 className="mb-1 text-lg">Account</h2>
            <p className="mb-4 break-all text-sm text-muted">{user.email}</p>
            <form action={signOut}><button className="btn-ghost">Log out</button></form>
          </section>
        </div>
      </div>
    </>
  );
}
