import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "../env";

const PROTECTED = ["/practice", "/sql-practice", "/companies","/billing", "/resources", "/analytics", "/dashboard", "/dsa", "/core", "/sprint", "/applications", "/saved", "/settings", "/onboarding"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (request.nextUrl.pathname === "/api/billing/webhook" || !supabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const protectedPage = PROTECTED.some(p => path === p || path.startsWith(`${p}/`));
  function redirectWithCookies(url: URL) {
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  if (!user && protectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return redirectWithCookies(url);
  }
  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectWithCookies(url);
  }
  if (protectedPage || path === "/system-design" || response.cookies.getAll().length) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
