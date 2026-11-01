-- Fast Sprint V1: 8 tables. Everything user-owned is protected by RLS on auth.uid().

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ───────── profiles (identity + onboarding + goal) ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  college text,
  branch text,
  graduation_year int check (graduation_year between 2000 and 2100),
  target_role text,
  target_company text,
  timezone text not null default 'Asia/Kolkata',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── user_entitlements (Free / Pro) ─────────
create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active' check (status in ('active','expired','revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,                      -- null = no expiry (free)
  source text not null default 'signup' check (source in ('signup','manual','promo','payment')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- True while the user holds an unexpired, active Pro entitlement.
create or replace function public.has_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_entitlements e
    where e.user_id = uid and e.plan = 'pro' and e.status = 'active'
      and e.starts_at <= now() and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- ───────── content_items (one flexible tree for all learning content) ─────────
-- subject > topic > section > problem | resource. Order is kept in `position`.
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.content_items(id) on delete cascade,
  root_id uuid references public.content_items(id) on delete cascade,   -- set by trigger; lets us load a whole tree in one query
  item_type text not null check (item_type in ('subject','topic','section','problem','resource')),
  path text not null unique,                    -- e.g. dsa/arrays/two-pointers/two-sum (import upserts on this)
  slug text not null,
  title text not null,
  description text,
  url text,                                     -- external link (LeetCode, GfG, YouTube…)
  url_key text,                                 -- normalised URL for duplicate detection
  platform text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  tags text[] not null default '{}',
  position int not null default 0,
  is_pro boolean not null default false,        -- Pro-only items are hidden by RLS from Free users
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_items_parent_idx on public.content_items(parent_id, position);
create index content_items_root_idx on public.content_items(root_id, position);
create index content_items_url_key_idx on public.content_items(url_key) where url_key is not null;

create or replace function public.content_items_set_root() returns trigger
language plpgsql as $$
begin
  if new.parent_id is null then new.root_id := new.id;
  else select root_id into new.root_id from public.content_items where id = new.parent_id;
  end if;
  return new;
end $$;
create trigger content_items_root before insert or update of parent_id on public.content_items
  for each row execute function public.content_items_set_root();

-- ───────── per-user data ─────────
create table public.user_item_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.content_items(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','attempted','done')),
  needs_revision boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index user_item_progress_done_idx on public.user_item_progress(user_id, completed_at desc) where status = 'done';

create table public.user_notes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.content_items(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.user_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_date date not null,
  title text not null check (char_length(title) between 1 and 200),
  notes text,
  item_id uuid references public.content_items(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','done')),
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index daily_tasks_user_date_idx on public.daily_tasks(user_id, task_date);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 120),
  role text not null check (char_length(role) between 1 and 120),
  status text not null default 'wishlist' check (status in ('wishlist','applied','online_assessment','interview','offer','rejected','withdrawn')),
  applied_on date,
  deadline date,
  job_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_user_idx on public.applications(user_id, status);

-- ───────── triggers ─────────
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger entitlements_updated before update on public.user_entitlements for each row execute function public.set_updated_at();
create trigger content_updated before update on public.content_items for each row execute function public.set_updated_at();
create trigger progress_updated before update on public.user_item_progress for each row execute function public.set_updated_at();
create trigger notes_updated before update on public.user_notes for each row execute function public.set_updated_at();
create trigger applications_updated before update on public.applications for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_entitlements (user_id, plan, status, source) values (new.id, 'free', 'active', 'signup');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────── Free plan limits (enforced in the database, not only the UI) ─────────
-- Free: up to 10 applications and 5 sprint tasks per day. Pro: unlimited. Change the numbers here.
create or replace function public.enforce_free_limits() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if public.has_pro(new.user_id) then return new; end if;
  if tg_table_name = 'applications' then
    select count(*) into n from public.applications where user_id = new.user_id;
    if n >= 10 then raise exception 'plan_limit: Free plan allows up to 10 applications. Upgrade to Pro for unlimited.'; end if;
  elsif tg_table_name = 'daily_tasks' then
    select count(*) into n from public.daily_tasks where user_id = new.user_id and task_date = new.task_date;
    if n >= 5 then raise exception 'plan_limit: Free plan allows up to 5 sprint tasks per day. Upgrade to Pro for unlimited.'; end if;
  end if;
  return new;
end $$;
create trigger applications_limit before insert on public.applications for each row execute function public.enforce_free_limits();
create trigger daily_tasks_limit before insert on public.daily_tasks for each row execute function public.enforce_free_limits();

-- ───────── Row Level Security ─────────
alter table public.profiles enable row level security;
create policy "profile read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profile update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Entitlements: users can read their own; nobody but the service role can write.
alter table public.user_entitlements enable row level security;
create policy "entitlement read own" on public.user_entitlements for select to authenticated using (user_id = (select auth.uid()));

-- Content: readable by signed-in users; Pro-only items require an active Pro entitlement. Writes: service role only.
alter table public.content_items enable row level security;
create policy "content read" on public.content_items for select to authenticated
  using (not is_pro or public.has_pro((select auth.uid())));

do $$
declare t text;
begin
  foreach t in array array['user_item_progress','user_notes','user_bookmarks','daily_tasks','applications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ───────── Granting Pro (service role only) ─────────
-- select public.grant_pro('<user uuid>', 3);   -- 3 months from now (extends if already Pro)
create or replace function public.grant_pro(p_user uuid, p_months int, p_source text default 'manual', p_note text default null)
returns public.user_entitlements language plpgsql security definer set search_path = public as $$
declare cur public.user_entitlements; base timestamptz; res public.user_entitlements;
begin
  if p_months <= 0 then raise exception 'months must be positive'; end if;
  select * into cur from public.user_entitlements where user_id = p_user;
  base := case when cur.plan = 'pro' and cur.status = 'active' and cur.expires_at > now() then cur.expires_at else now() end;
  insert into public.user_entitlements (user_id, plan, status, starts_at, expires_at, source, note)
  values (p_user, 'pro', 'active', now(), base + make_interval(months => p_months), p_source, p_note)
  on conflict (user_id) do update set plan = 'pro', status = 'active', starts_at = now(),
    expires_at = excluded.expires_at, source = excluded.source, note = excluded.note
  returning * into res;
  return res;
end $$;
revoke all on function public.grant_pro(uuid, int, text, text) from public, anon, authenticated;
grant execute on function public.grant_pro(uuid, int, text, text) to service_role;

-- ───────── Structural seed (no educational content) ─────────
insert into public.content_items (item_type, path, slug, title, position) values
  ('subject', 'dsa',  'dsa',  'Data Structures & Algorithms',  1),
  ('subject', 'dbms', 'dbms', 'Database Management Systems',  2),
  ('subject', 'os',   'os',   'Operating Systems',             3),
  ('subject', 'cn',   'cn',   'Computer Networks',             4),
  ('subject', 'oop',  'oop',  'Object-Oriented Programming',   5)
on conflict (path) do nothing;
