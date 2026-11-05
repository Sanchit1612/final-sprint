import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions, SUPABASE_KEY, SUPABASE_URL } from "../env";

export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_KEY, { cookieOptions: authCookieOptions() });
