-- Additive account storage for manifest-backed learning items. Approval required.
create table public.learning_item_state (
 user_id uuid not null references public.profiles(id) on delete cascade,
 root_slug text not null check(root_slug in ('dsa-200','dsa-a2z','dsa-neetcode150','dbms','sql','os','cn','oop','aptitude','behavioural','interview','development','companies')),
 item_id uuid not null,
 done boolean not null default false,
 revise boolean not null default false,
 bookmarked boolean not null default false,
 note text not null default '' check(length(note)<=5000),
 updated_at timestamptz not null default now(),
 primary key(user_id,root_slug,item_id)
);
alter table public.learning_item_state enable row level security;
revoke all on public.learning_item_state from public,anon;
grant select,insert,update,delete on public.learning_item_state to authenticated,service_role;
create policy "read own learning state" on public.learning_item_state for select to authenticated using(user_id=(select auth.uid()));
create policy "insert accessible learning state" on public.learning_item_state for insert to authenticated with check(user_id=(select auth.uid()) and (root_slug in ('dsa-200','dsa-a2z','dsa-neetcode150','dbms','sql','os','cn','oop') or public.has_pro((select auth.uid()))));
create policy "update accessible learning state" on public.learning_item_state for update to authenticated using(user_id=(select auth.uid()) and (root_slug in ('dsa-200','dsa-a2z','dsa-neetcode150','dbms','sql','os','cn','oop') or public.has_pro((select auth.uid())))) with check(user_id=(select auth.uid()) and (root_slug in ('dsa-200','dsa-a2z','dsa-neetcode150','dbms','sql','os','cn','oop') or public.has_pro((select auth.uid()))));
create policy "delete own learning state" on public.learning_item_state for delete to authenticated using(user_id=(select auth.uid()));
create trigger learning_state_updated before update on public.learning_item_state for each row execute function public.set_updated_at();
