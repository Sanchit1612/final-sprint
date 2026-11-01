import { cache } from "react";
import { redirect } from "next/navigation";
import { isProActive, type Entitlement } from "@/config/plans";
import { todayIn } from "./dates";
import { supabaseConfigured } from "./env";
import { createClient } from "./supabase/server";

export interface Profile {
  id: string; full_name: string | null; college: string | null; branch: string | null; graduation_year: number | null;
  target_role: string | null; target_company: string | null; timezone: string; onboarded_at: string | null;
}

export const getSession = cache(async () => {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile, error: profileError }, { data: ent, error: entitlementError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_entitlements").select("plan,status,starts_at,expires_at").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || entitlementError) throw new Error("Could not load your account. Please try again.");
  if (!profile) throw new Error("Your account profile is missing. Please contact support.");
  const tz = profile?.timezone ?? "Asia/Kolkata";
  return {
    supabase, user, profile: profile as Profile | null, entitlement: ent as Entitlement | null,
    isPro: isProActive(ent as Entitlement | null), tz, today: todayIn(tz),
  };
});

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}
