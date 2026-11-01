import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";
const db = new PGlite();
const uid = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  // Minimal Supabase identity contract; real Auth/OAuth is tested separately.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema public, auth to authenticated;
  `);
  for (const path of ["0001_v1_schema.sql", "0002_quota_security.sql"]) await db.exec(readFileSync(`supabase/migrations/${path}`, "utf8"));
  await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated;
    insert into auth.users values ('${uid}', '{}'), ('${other}', '{}');`);
}, 30000);
afterAll(async () => { await db.close(); });
it("enforces inserts, moves and allows completing tasks at capacity", async () => {
  for (let i = 0; i < 5; i++) await db.query("insert into daily_tasks(user_id,task_date,title) values ($1,'2026-11-01','task')", [uid]);
  await expect(db.query("insert into daily_tasks(user_id,task_date,title) values ($1,'2026-11-01','sixth')", [uid])).rejects.toThrow("plan_limit");
  await db.query("insert into daily_tasks(user_id,task_date,title) values ($1,'2026-10-31','missed')", [uid]);
  await expect(db.query("update daily_tasks set task_date='2026-11-01' where title='missed'")).rejects.toThrow("plan_limit");
  await db.exec("update daily_tasks set status='done' where task_date='2026-11-01'");
  const { rows } = await db.query<{ count: number }>("select count(*)::int as count from daily_tasks where status='done'");
  expect(rows[0].count).toBe(5);
});
it("enforces application quota and permits status changes", async () => {
  for (let i = 0; i < 10; i++) await db.query("insert into applications(user_id,company,role) values ($1,'Company','Role')", [uid]);
  await expect(db.query("insert into applications(user_id,company,role) values ($1,'Extra','Role')", [uid])).rejects.toThrow("plan_limit");
  await db.exec("update applications set status='applied'");
});
it("isolates private data and denies self-grants under the authenticated role", async () => {
  await db.exec(`set request.jwt.claim.sub = '${other}'; set role authenticated;`);
  try {
    expect((await db.query("select * from daily_tasks")).rows).toHaveLength(0);
    await expect(db.query("insert into user_entitlements(user_id,plan) values ($1,'pro')", [other])).rejects.toThrow();
    await expect(db.query("select grant_pro($1,3)", [other])).rejects.toThrow();
    expect((await db.query("update user_entitlements set plan='pro' returning *")).rows).toHaveLength(0);
  } finally { await db.exec("reset role"); }
});
it("hides premium content and denies progress writes until a trusted grant", async () => {
  const { rows } = await db.query<{ id: string }>("insert into content_items(item_type,path,slug,title,is_pro) values ('problem','premium','premium','Premium',true) returning id");
  await db.exec(`set request.jwt.claim.sub = '${other}'; set role authenticated;`);
  try {
    expect((await db.query("select * from content_items where path='premium'")).rows).toHaveLength(0);
    await expect(db.query("insert into user_item_progress(user_id,item_id) values ($1,$2)", [other, rows[0].id])).rejects.toThrow();
  } finally { await db.exec("reset role"); }
  await db.query("select grant_pro($1,1)", [other]);
  await db.exec("set role authenticated");
  try {
    expect((await db.query("select * from content_items where path='premium'")).rows).toHaveLength(1);
    await db.query("insert into user_item_progress(user_id,item_id) values ($1,$2)", [other, rows[0].id]);
  } finally { await db.exec("reset role"); }
});
