-- Approval required. Additive; does not modify existing content or entitlements.
create table public.quiz_attempts (
 id uuid primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 subject text not null check(subject in ('mixed','dbms','os','cn','oop')),
 quota_day date not null default ((now() at time zone 'UTC')::date),
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) in (10,15,20)),
 answers jsonb, score integer, started_at timestamptz not null default now(),submitted_at timestamptz
);
create index quiz_attempts_owner_day on public.quiz_attempts(user_id,quota_day);
alter table public.quiz_attempts enable row level security;
-- Snapshots include answer keys: no client table access, including SELECT.
revoke all on public.quiz_attempts from public,anon,authenticated;
grant all on public.quiz_attempts to service_role;
create function public.start_quiz(p_user uuid,p_id uuid,p_subject text,p_questions jsonb)
returns public.quiz_attempts language plpgsql security definer set search_path=public as $$
declare existing public.quiz_attempts; result public.quiz_attempts; day date := (now() at time zone 'UTC')::date;
begin
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Account unavailable'; end if;
 select * into existing from public.quiz_attempts where id=p_id;
 if found then
  if existing.user_id<>p_user or existing.subject<>p_subject or jsonb_array_length(existing.questions)<>jsonb_array_length(p_questions) then raise exception 'Attempt mismatch'; end if;
  return existing;
 end if;
 if not public.has_pro(p_user) and exists(select 1 from public.quiz_attempts where user_id=p_user and quota_day=day) then raise exception 'daily_quiz_limit'; end if;
 insert into public.quiz_attempts(id,user_id,subject,questions,quota_day) values(p_id,p_user,p_subject,p_questions,day) returning * into result;return result;
end $$;
create function public.submit_quiz(p_user uuid,p_id uuid,p_answers jsonb)
returns public.quiz_attempts language plpgsql security definer set search_path=public as $$
declare attempt public.quiz_attempts; n integer; points integer;
begin
 select * into attempt from public.quiz_attempts where id=p_id and user_id=p_user for update;
 if not found then raise exception 'Attempt unavailable'; end if;
 if attempt.submitted_at is not null then return attempt; end if;
 n:=jsonb_array_length(attempt.questions);
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>n then raise exception 'Invalid answers'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) a where a<>'null'::jsonb and a not in ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb)) then raise exception 'Invalid answer choice'; end if;
 select count(*)::int into points from generate_series(0,n-1) i where p_answers->i=attempt.questions->i->'correct';
 update public.quiz_attempts set answers=p_answers,score=points,submitted_at=now() where id=p_id returning * into attempt;
 return attempt;
end $$;
revoke all on function public.start_quiz(uuid,uuid,text,jsonb),public.submit_quiz(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.start_quiz(uuid,uuid,text,jsonb),public.submit_quiz(uuid,uuid,jsonb) to service_role;
create table public.study_progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 item_key text not null check(length(item_key) between 1 and 150),
 completed boolean not null default false, updated_at timestamptz not null default now(),primary key(user_id,item_key)
);
alter table public.study_progress enable row level security;
create policy "own study rows" on public.study_progress for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.study_progress to authenticated;
revoke all on public.study_progress from anon;
create trigger study_progress_updated before update on public.study_progress for each row execute function public.set_updated_at();
