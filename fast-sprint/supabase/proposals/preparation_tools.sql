-- PROPOSAL ONLY. No changes to content or existing user records.
-- Company completion and bookmarks are separate from learning collection checklists.
create table public.company_problem_progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 company_slug text not null check (company_slug ~ '^[a-z0-9-]{1,100}$'),
 problem_slug text not null check (problem_slug ~ '^[a-z0-9-]{1,200}$'),
 completed boolean not null default false,
 bookmarked boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key (user_id,company_slug,problem_slug)
);
create trigger company_progress_updated before update on public.company_problem_progress
 for each row execute function public.set_updated_at();
alter table public.company_problem_progress enable row level security;
create policy "read own company progress" on public.company_problem_progress for select to authenticated using (user_id=(select auth.uid()));
create policy "insert own Pro company progress" on public.company_problem_progress for insert to authenticated with check (user_id=(select auth.uid()) and public.has_pro((select auth.uid())));
create policy "update own Pro company progress" on public.company_problem_progress for update to authenticated using (user_id=(select auth.uid()) and public.has_pro((select auth.uid()))) with check (user_id=(select auth.uid()) and public.has_pro((select auth.uid())));
create policy "delete own company progress" on public.company_problem_progress for delete to authenticated using (user_id=(select auth.uid()));
-- Confidence-based scheduling, separate from completion timestamps and manual revision flags.
create table public.item_reviews (
 user_id uuid not null references public.profiles(id) on delete cascade,
 item_id uuid not null references public.content_items(id) on delete cascade,
 rating text not null check (rating in ('again','hard','good','easy')),
 step integer not null default 0 check (step between 0 and 6),
 due_date date not null,
 graduated boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create trigger item_reviews_updated before update on public.item_reviews for each row execute function public.set_updated_at();
alter table public.item_reviews enable row level security;
create policy "read own reviews" on public.item_reviews for select to authenticated using (user_id=(select auth.uid()));
create policy "insert own accessible reviews" on public.item_reviews for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.content_items c where c.id=item_id));
create policy "update own accessible reviews" on public.item_reviews for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.content_items c where c.id=item_id));
create policy "delete own reviews" on public.item_reviews for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.company_problem_progress,public.item_reviews to authenticated;
revoke all on public.company_problem_progress,public.item_reviews from anon;
