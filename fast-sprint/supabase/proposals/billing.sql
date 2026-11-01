-- PROPOSAL ONLY. Not applied remotely. Review/approval required before staging or production.
-- Test-mode receipts NEVER change real account entitlements.
begin;
create table public.payment_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 request_id uuid not null, provider_order_id text unique, provider_payment_id text unique,
 mode text not null check(mode in ('test','live')), months int not null check(months in (1,3,6)),
 amount int not null, currency text not null check(currency='INR'),
 status text not null default 'creating' check(status in ('creating','created','paid')),
 created_at timestamptz not null default now(), paid_at timestamptz,
 unique(user_id,request_id,mode),
 check(amount=case months when 1 then 8900 when 3 then 21900 when 6 then 39900 end)
);
-- Enforce order-creation rate limits under a row lock, including concurrent sessions.
create function public.limit_checkout_orders() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.profiles where id=new.user_id for update;
 if (select count(*) from public.payment_orders where user_id=new.user_id and created_at>now()-interval '15 minutes')>=5 then raise exception 'Too many checkout attempts. Check payment history and try later.'; end if;
 return new;
end $$;
revoke all on function public.limit_checkout_orders() from public,anon,authenticated;
create trigger checkout_rate before insert on public.payment_orders for each row execute function public.limit_checkout_orders();
create table public.payment_events (
 event_id text primary key, order_id uuid not null references public.payment_orders(id),
 payment_id text not null, received_at timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_orders,public.payment_events from anon,authenticated;
grant select on public.payment_orders to authenticated;
grant all on public.payment_orders,public.payment_events to service_role;
create policy "payment history own" on public.payment_orders for select to authenticated using(user_id=(select auth.uid()));
create function public.settle_payment(p_order uuid,p_payment text,p_event text,p_mode text,p_amount int,p_currency text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.payment_orders;
begin
 select * into o from public.payment_orders where id=p_order for update;
 if not found or o.provider_order_id is null or o.mode<>p_mode or o.amount<>p_amount or o.currency<>p_currency or p_payment !~ '^pay_[a-zA-Z0-9]+$' then raise exception 'invalid order settlement'; end if;
 if o.status='paid' then
  if o.provider_payment_id<>p_payment then raise exception 'different payment already settled'; end if;
  return false;
 end if;
 if o.status<>'created' then raise exception 'order not ready'; end if;
 -- Match existing quota lock order; serialises grants for separate orders of this account.
 perform 1 from public.profiles where id=o.user_id for update;
 insert into public.payment_events(event_id,order_id,payment_id) values(p_event,o.id,p_payment);
 update public.payment_orders set status='paid',provider_payment_id=p_payment,paid_at=now() where id=o.id;
 if o.mode='live' then perform public.grant_pro(o.user_id,o.months,'payment','razorpay:'||p_payment); end if;
 return true;
end $$;
revoke all on function public.settle_payment(uuid,text,text,text,int,text) from public,anon,authenticated;
grant execute on function public.settle_payment(uuid,text,text,text,int,text) to service_role;
-- Serialize manual grants with payment grants as well (preserves original extension behaviour).
create or replace function public.grant_pro(p_user uuid,p_months int,p_source text default 'manual',p_note text default null)
returns public.user_entitlements language plpgsql security definer set search_path=public,pg_temp as $$
declare cur public.user_entitlements; base timestamptz; res public.user_entitlements;
begin
 if p_months<=0 then raise exception 'months must be positive'; end if;
 perform 1 from public.profiles where id=p_user for update;
 select * into cur from public.user_entitlements where user_id=p_user;
 base:=case when cur.plan='pro' and cur.status='active' and (cur.expires_at is null or cur.expires_at>now()) then cur.expires_at else now() end;
 insert into public.user_entitlements(user_id,plan,status,starts_at,expires_at,source,note)
 values(p_user,'pro','active',now(),case when base is null then null else base+make_interval(months=>p_months) end,p_source,p_note)
 on conflict(user_id) do update set plan='pro',status='active',starts_at=now(),expires_at=excluded.expires_at,source=excluded.source,note=excluded.note returning * into res;
 return res;
end $$;
commit;
