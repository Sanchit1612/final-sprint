-- Fast Sprint: core schema. Enum-like values use text + CHECK so new values never need a type migration.

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create domain public.entity_kind as text check (value in (
  'dsa_topic','dsa_problem','core_topic','roadmap_milestone','interview_question','quiz'
));

-- ───────────── Users ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  college text,
  branch text,
  graduation_year int check (graduation_year between 2000 and 2100),
  timezone text not null default 'Asia/Kolkata',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── Development tracks & roadmaps ─────────────
create table public.development_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  position int not null default 0,
  is_pro boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.roadmap_milestones (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.development_tracks(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  position int not null default 0,
  estimated_hours numeric(5,1),
  created_at timestamptz not null default now(),
  unique (track_id, slug)
);
create index roadmap_milestones_track_idx on public.roadmap_milestones(track_id, position);

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.roadmap_milestones(id) on delete cascade,
  slug text not null,
  title text not null,
  position int not null default 0,
  unique (milestone_id, slug)
);
create index roadmap_items_milestone_idx on public.roadmap_items(milestone_id, position);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  target_role text,
  target_company text,
  preparation_deadline date,
  current_level text not null default 'beginner' check (current_level in ('beginner','intermediate','advanced')),
  daily_hours numeric(3,1) not null default 2 check (daily_hours > 0 and daily_hours <= 16),
  study_days smallint[] not null default '{1,2,3,4,5,6}',
  development_track_id uuid references public.development_tracks(id) on delete set null,
  auto_revision boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ───────────── DSA ─────────────
create table public.dsa_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dsa_problems (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.dsa_topics(id) on delete cascade,
  slug text not null,
  title text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  url text,
  url_key text,                       -- normalised URL, used for duplicate detection
  platform text,
  tags text[] not null default '{}',
  companies text[] not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);
create index dsa_problems_topic_idx on public.dsa_problems(topic_id, position);
create unique index dsa_problems_topic_url_key on public.dsa_problems(topic_id, url_key) where url_key is not null;

create table public.user_problem_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  problem_id uuid not null references public.dsa_problems(id) on delete cascade,
  status text not null default 'unsolved' check (status in ('unsolved','attempted','solved')),
  solved_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);
create index user_problem_progress_status_idx on public.user_problem_progress(user_id, status);

-- ───────────── Core CS ─────────────
create table public.core_subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  position int not null default 0
);

create table public.core_topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.core_subjects(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, slug)
);
create index core_topics_subject_idx on public.core_topics(subject_id, position);

create table public.core_topic_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.core_topics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

-- ───────────── Quizzes (aptitude + core CS) ─────────────
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  domain text not null check (domain in ('aptitude','core_cs')),
  category text,
  subject_id uuid references public.core_subjects(id) on delete set null,
  topic_id uuid references public.core_topics(id) on delete set null,
  difficulty text check (difficulty in ('easy','medium','hard')),
  description text,
  time_limit_seconds int check (time_limit_seconds is null or time_limit_seconds > 0),
  is_pro boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index quizzes_domain_idx on public.quizzes(domain, category);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  external_id text not null,
  position int not null default 0,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index smallint not null check (correct_index >= 0),
  explanation text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  unique (quiz_id, external_id)
);
create index quiz_questions_quiz_idx on public.quiz_questions(quiz_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  started_at timestamptz,
  submitted_at timestamptz not null default now(),
  submitted_on date not null default current_date,
  duration_seconds int,
  score int not null,
  total int not null,
  answers jsonb not null default '{}'
);
create index quiz_attempts_user_idx on public.quiz_attempts(user_id, submitted_at desc);
create index quiz_attempts_quiz_idx on public.quiz_attempts(user_id, quiz_id);

-- ───────────── Interview preparation ─────────────
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('hr','behavioural','technical')),
  external_id text not null,
  prompt text not null,
  guidance text,
  topic text,
  company text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  tags text[] not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (category, external_id)
);
create index interview_questions_cat_idx on public.interview_questions(category, position);

create table public.interview_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','practiced')),
  confidence smallint check (confidence between 1 and 5),
  response jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- ───────────── Resources (links, playlists, PDFs) + mapping ─────────────
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'article' check (kind in ('video','playlist','article','pdf','notes','docs','course','practice','other')),
  title text not null,
  url text not null,
  url_key text not null unique,
  provider text,
  duration_minutes int,
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.resource_links (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  entity_type public.entity_kind not null,
  entity_id uuid not null,
  position int not null default 0,
  unique (resource_id, entity_type, entity_id)
);
create index resource_links_entity_idx on public.resource_links(entity_type, entity_id, position);

-- ───────────── Roadmap progress ─────────────
create table public.user_roadmap_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.roadmap_items(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ───────────── Bookmarks and notes ─────────────
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type public.entity_kind not null,
  entity_id uuid not null,
  title text not null,
  href text,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);
create index bookmarks_user_idx on public.bookmarks(user_id, created_at desc);

create table public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type public.entity_kind not null,
  entity_id uuid not null,
  title text not null,
  href text,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);
create index personal_notes_user_idx on public.personal_notes(user_id, updated_at desc);

-- ───────────── Placement Mode ─────────────
create table public.placement_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  target_role text not null,
  target_company text,
  start_date date not null,
  deadline date not null,
  level text not null check (level in ('beginner','intermediate','advanced')),
  daily_hours numeric(3,1) not null check (daily_hours > 0 and daily_hours <= 16),
  study_days smallint[] not null,
  track_slug text,
  template_overrides jsonb not null default '{}',   -- { "<template key>": { "enabled": false } }
  paused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deadline >= start_date)
);
-- one live (active or paused) plan per user
create unique index placement_plans_one_live on public.placement_plans(user_id) where status in ('active','paused');

create table public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.placement_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_date date not null,
  kind text not null check (kind in ('dsa','core','roadmap','aptitude','interview','revision','review','custom')),
  template_key text,
  title text not null,
  description text,
  estimated_minutes int not null check (estimated_minutes > 0),
  status text not null default 'pending' check (status in ('pending','completed','skipped')),
  completed_at timestamptz,
  rescheduled_from date,
  reschedule_count int not null default 0,
  source text not null default 'generated' check (source in ('generated','manual')),
  entity_type text,
  entity_id uuid,
  href text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index scheduled_tasks_user_date_idx on public.scheduled_tasks(user_id, scheduled_date);
create index scheduled_tasks_plan_status_idx on public.scheduled_tasks(plan_id, status, scheduled_date);

-- ───────────── Revision engine ─────────────
create table public.revision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type public.entity_kind not null,
  entity_id uuid not null,
  title text not null,
  href text,
  step smallint not null default 0,
  due_date date not null,
  last_reviewed_at timestamptz,
  review_count int not null default 0,
  status text not null default 'active' check (status in ('active','graduated','archived')),
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);
create index revision_items_due_idx on public.revision_items(user_id, status, due_date);

create table public.revision_reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.revision_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_on date not null,
  rating text not null check (rating in ('again','hard','good','easy')),
  step_before smallint not null,
  step_after smallint not null,
  interval_days int not null,
  created_at timestamptz not null default now()
);
create index revision_reviews_user_idx on public.revision_reviews(user_id, reviewed_on desc);
create index revision_reviews_item_idx on public.revision_reviews(item_id, created_at desc);

-- ───────────── Tracking ─────────────
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  minutes int not null check (minutes > 0 and minutes <= 1440),
  area text not null default 'other' check (area in ('dsa','core','roadmap','aptitude','interview','revision','review','other')),
  task_id uuid references public.scheduled_tasks(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index study_sessions_user_idx on public.study_sessions(user_id, session_date desc);

create table public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  entity_type text,
  entity_id uuid,
  occurred_on date not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index user_activity_user_day_idx on public.user_activity(user_id, occurred_on desc);

-- ───────────── Subscriptions ─────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  current_period_end timestamptz,        -- Pro access ends here (fixed-term passes, no auto-renew)
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  bundle_months int not null check (bundle_months > 0),
  amount_minor int not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_user_idx on public.payments(user_id, created_at desc);

-- ───────────── Triggers ─────────────
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger prefs_updated before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger dsa_topics_updated before update on public.dsa_topics for each row execute function public.set_updated_at();
create trigger dsa_problems_updated before update on public.dsa_problems for each row execute function public.set_updated_at();
create trigger upp_updated before update on public.user_problem_progress for each row execute function public.set_updated_at();
create trigger ctp_updated before update on public.core_topic_progress for each row execute function public.set_updated_at();
create trigger ip_updated before update on public.interview_progress for each row execute function public.set_updated_at();
create trigger notes_updated before update on public.personal_notes for each row execute function public.set_updated_at();
create trigger plans_updated before update on public.placement_plans for each row execute function public.set_updated_at();
create trigger subs_updated before update on public.subscriptions for each row execute function public.set_updated_at();

-- New auth user -> profile + preferences + free subscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- True while the user holds an unexpired Pro pass. Available for RLS or SQL use later.
create or replace function public.is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid and s.plan = 'pro' and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;
