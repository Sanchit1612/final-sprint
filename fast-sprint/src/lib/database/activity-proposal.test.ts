import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
it("proposal records transitions with server time and denies forged history", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to authenticated;`);
    for (const f of ["supabase/migrations/0001_v1_schema.sql", "supabase/migrations/0002_quota_security.sql", "supabase/proposals/learning_activity.sql"]) await db.exec(readFileSync(f,"utf8"));
    const a="11111111-1111-4111-8111-111111111111", b="22222222-2222-4222-8222-222222222222";
    await db.query("insert into auth.users values ($1,'{}'),($2,'{}')",[a,b]);
    await db.query("insert into daily_tasks(user_id,task_date,title) values ($1,'2026-11-01','fixture')",[a]);
    await db.exec("update daily_tasks set status='done',completed_at='2001-01-01'; update daily_tasks set status='done'; update daily_tasks set status='pending'");
    const {rows}=await db.query<{n:number}>("select count(*)::int n from learning_activity where occurred_at > '2026-01-01'");
    expect(rows[0].n).toBe(1);
    await db.exec("delete from daily_tasks");
    expect((await db.query("select * from learning_activity")).rows).toHaveLength(1);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
    await db.exec("set role authenticated");
    expect((await db.query("select * from learning_activity")).rows).toHaveLength(0);
    await expect(db.query("insert into learning_activity(user_id,source_type,source_id) values ($1,'task',$1)",[b])).rejects.toThrow();
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
    await db.exec("set role authenticated");
    expect((await db.query("select * from learning_activity")).rows).toHaveLength(1);
  } finally { await db.close(); }
},30000);
