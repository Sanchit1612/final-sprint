-- PROPOSAL ONLY. Not a migration; do not apply without explicit approval.
-- Records future completion transitions, not fabricated historical activity.
begin;
create table public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('checklist','task')),
  source_id uuid not null,
  -- No source FK: retain learning history when the original task/content is removed.
  occurred_at timestamptz not null default now()
);
create index learning_activity_owner_time on public.learning_activity(user_id, occurred_at desc, id);
alter table public.learning_activity enable row level security;
revoke all on public.learning_activity from public, anon, authenticated;
grant select on public.learning_activity to authenticated;
create policy "activity read own" on public.learning_activity for select to authenticated
  using (user_id = (select auth.uid()));

create function public.record_learning_completion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'done' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'done' then return new; end if;
  end if;
  if tg_table_name = 'user_item_progress' then
    insert into public.learning_activity(user_id,source_type,source_id,occurred_at)
      values (new.user_id,'checklist',new.item_id,now());
  elsif tg_table_name = 'daily_tasks' then
    insert into public.learning_activity(user_id,source_type,source_id,occurred_at)
      values (new.user_id,'task',new.id,now());
  end if;
  return new;
end $$;
revoke all on function public.record_learning_completion() from public, anon, authenticated;
create trigger progress_record_learning after insert or update of status on public.user_item_progress
  for each row execute function public.record_learning_completion();
create trigger tasks_record_learning after insert or update of status on public.daily_tasks
  for each row execute function public.record_learning_completion();
commit;
