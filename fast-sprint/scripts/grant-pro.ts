/**
 * Grant or extend a Pro pass (service role only; never runs in the browser).
 *   npm run entitlement:grant -- user@example.com 3 "note"
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const [email, monthsRaw, note] = process.argv.slice(2);
  const months = Number(monthsRaw);
  if (!email || !Number.isInteger(months) || months <= 0) { console.error('Usage: npm run entitlement:grant -- <email> <months> ["note"]'); process.exit(1); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."); process.exit(1); }
  const db = createClient(url, key, { auth: { persistSession: false } });

  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (data.users.length < 200) break;
  }
  if (!userId) { console.error(`No user with email ${email}.`); process.exit(1); }
  const { data, error } = await db.rpc("grant_pro", { p_user: userId, p_months: months, p_source: "manual", p_note: note ?? null });
  if (error) throw error;
  console.log(`Pro granted to ${email} until ${data.expires_at}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
