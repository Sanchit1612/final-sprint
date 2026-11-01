-- Row Level Security. Users only ever see their own rows; content is read-only to signed-in users.
-- Content is written with the service role key (scripts/import-content.ts), which bypasses RLS.

-- Profiles are keyed by id
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- User-owned tables (all operations restricted to the owner)
do $$
declare t text;
begin
  foreach t in array array[
    'user_preferences','user_problem_progress','core_topic_progress','quiz_attempts','interview_progress',
    'user_roadmap_progress','bookmarks','personal_notes','placement_plans','revision_items','revision_reviews',
    'study_sessions','user_activity'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Tasks must belong to one of the user''s own plans
alter table public.scheduled_tasks enable row level security;
create policy "tasks select own" on public.scheduled_tasks for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks modify own" on public.scheduled_tasks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.placement_plans p where p.id = plan_id and p.user_id = (select auth.uid()))
  );

-- Billing rows are read-only for users; only the service role (payment webhook) writes them
alter table public.subscriptions enable row level security;
create policy "subscriptions select own" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));
alter table public.payments enable row level security;
create policy "payments select own" on public.payments for select to authenticated using (user_id = (select auth.uid()));

-- Content tables: readable by signed-in users, writable only by the service role
do $$
declare t text;
begin
  foreach t in array array[
    'development_tracks','roadmap_milestones','roadmap_items','dsa_topics','dsa_problems','core_subjects',
    'core_topics','quiz_questions','interview_questions','resources','resource_links'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "content read" on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

alter table public.quizzes enable row level security;
create policy "quizzes read published" on public.quizzes for select to authenticated using (published);
