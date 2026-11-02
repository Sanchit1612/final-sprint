import { NextResponse, type NextRequest } from "next/server";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const raw = searchParams.get("next") ?? "/dashboard";
  const next = safeAuthRedirect(raw);
  if (searchParams.get("error") === "access_denied") return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Sign-in was cancelled. You can try again when ready.")}`);
  try {
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Sign-in is temporarily unavailable. Please try again.")}`);
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That sign-in link is invalid or has expired. Try again.")}`);
}
