export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Production is served over HTTPS; keep development usable on localhost HTTP.
export const authCookieOptions = () => ({ secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" });
