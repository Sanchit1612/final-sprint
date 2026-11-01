-- Additive hardening. Apply after 0001; no user data is removed.
-- A per-owner row lock serializes quota checks, including moves and bulk writes.
create or replace function public.enforce_free_limits() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform 1 from public.profiles where id = new.user_id for update;
  if public.has_pro(new.user_id) then return new; end if;
  if tg_op = 'UPDATE' then
    if tg_table_name = 'daily_tasks' then
      if new.user_id = old.user_id and new.task_date = old.task_date then return new; end if;
    elsif new.user_id = old.user_id then return new;
    end if;
  end if;
  if tg_table_name = 'applications' then
    select count(*) into n from public.applications where user_id = new.user_id and id <> new.id;
    if n >= 10 then raise exception 'plan_limit: Free plan allows up to 10 applications. Upgrade to Pro for unlimited.'; end if;
  elsif tg_table_name = 'daily_tasks' then
    select count(*) into n from public.daily_tasks where user_id = new.user_id and task_date = new.task_date and id <> new.id;
    if n >= 5 then raise exception 'plan_limit: Free plan allows up to 5 sprint tasks per day. Upgrade to Pro for unlimited.'; end if;
  end if;
  return new;
end $$;
drop trigger applications_limit on public.applications;
create trigger applications_limit before insert or update on public.applications
  for each row execute function public.enforce_free_limits();
drop trigger daily_tasks_limit on public.daily_tasks;
create trigger daily_tasks_limit before insert or update on public.daily_tasks
  for each row execute function public.enforce_free_limits();

-- An owned progress row must also reference content the caller can read.
-- RLS on content_items evaluates the active entitlement using database time.
do $$
declare t text;
begin
  foreach t in array array['user_item_progress','user_notes','user_bookmarks'] loop
    execute format('create policy "accessible content" on public.%I as restrictive for all to authenticated
      using (exists (select 1 from public.content_items c where c.id = item_id))
      with check (exists (select 1 from public.content_items c where c.id = item_id))', t);
  end loop;
end $$;
