import Link from "next/link";
import { ApplicationsBoard, type App } from "@/components/ApplicationsBoard";
import { PageHeader } from "@/components/ui";
import { fetchAll } from "@/lib/tree";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Applications" };

export default async function Page() {
  const { supabase, isPro } = await requireSession();
  const data = await fetchAll<App>((a, b) => supabase.from("applications").select("id,company,role,status,applied_on,deadline,job_url,notes").order("created_at", { ascending: false }).order("id").range(a, b));
  return (
    <>
      <PageHeader title="Applications" subtitle="Keep every company, role and deadline in one place." />
      <ApplicationsBoard apps={(data ?? []) as App[]} />
      {!isPro && <p className="mt-6 text-xs text-muted">Free plan: up to 10 applications. <Link href="/pricing" className="text-accent hover:underline">See Pro</Link></p>}
    </>
  );
}
