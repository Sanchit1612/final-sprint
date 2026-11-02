-- REVIEW PROPOSAL: never applied automatically. Existing 0001/0002 remain unchanged.
-- Default: test receipts only. Test Pro requires BOTH the staging DB gate and app gate.
begin;
create table public.billing_environment (
 singleton boolean primary key default true check(singleton),
 mode text not null default 'test' check(mode in ('test','live')),
 allow_test_pro boolean not null default false,
 check(not allow_test_pro or mode='test')
);
insert into public.billing_environment default values;
create table public.payment_orders (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),request_id uuid not null,
 provider_order_id text unique,provider_payment_id text unique,mode text not null check(mode in ('test','live')),
 months int not null check(months in (1,3,6)),amount int not null,currency text not null check(currency='INR'),
 status text not null default 'creating' check(status in ('creating','created','paid','partially_refunded','refunded')),
 refunded_amount int not null default 0 check(refunded_amount>=0 and refunded_amount<=amount),
 created_at timestamptz not null default now(),paid_at timestamptz,abandoned_at timestamptz,last_failure_at timestamptz,
 unique(user_id,request_id,mode),check(amount=case months when 1 then 8900 when 3 then 21900 when 6 then 39900 end)
);
create index payment_orders_user_created on public.payment_orders(user_id,created_at desc);
create table public.payment_events (
 event_id text primary key,order_id uuid not null references public.payment_orders(id),payment_id text not null,
 event_type text not null default 'capture',received_at timestamptz not null default now()
);
create table public.payment_disputes (
 id text primary key,order_id uuid not null references public.payment_orders(id),
 status text not null check(status in ('open','under_review','won','lost','closed')),
 event_time bigint not null check(event_time>=0),updated_at timestamptz not null default now()
);
-- Keeps the old/manual entitlement separate from reversible, payment-funded terms.
create table public.billing_access_ledger (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),
 order_id uuid unique references public.payment_orders(id),kind text not null check(kind in ('baseline','manual','payment')),
 months int check(months>0),occurred_at timestamptz not null default now(),source text not null,note text,voided_at timestamptz,
 baseline_active boolean not null default false,baseline_starts timestamptz,baseline_expires timestamptz,
 check((kind='payment')=(order_id is not null)),check((kind='baseline')=(months is null))
);
create unique index billing_baseline_once on public.billing_access_ledger(user_id) where kind='baseline';
create index billing_ledger_user_order on public.billing_access_ledger(user_id,occurred_at,id);
do $$declare t text;begin
 foreach t in array array['billing_environment','payment_orders','payment_events','payment_disputes','billing_access_ledger'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.payment_orders to authenticated;
create policy "payment history own" on public.payment_orders for select to authenticated using(user_id=(select auth.uid()));
create function public.limit_checkout_orders() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.profiles where id=new.user_id for update;
 if new.mode<>(select mode from public.billing_environment where singleton) then raise exception 'Billing environment mismatch';end if;
 if (select count(*) from public.payment_orders where user_id=new.user_id and created_at>now()-interval '15 minutes')>=5 then raise exception 'Too many checkout attempts';end if;
 return new;
end $$;
create trigger checkout_rate before insert on public.payment_orders for each row execute function public.limit_checkout_orders();
create function public.billing_capture_baseline(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.profiles where id=p_user for update;
 insert into public.billing_access_ledger(user_id,kind,source,baseline_active,baseline_starts,baseline_expires)
 select user_id,'baseline',source,plan='pro' and status='active',starts_at,expires_at from public.user_entitlements where user_id=p_user
 on conflict(user_id) where kind='baseline' do nothing;
end $$;
create function public.billing_recompute(p_user uuid) returns public.user_entitlements language plpgsql security definer set search_path=public,pg_temp as $$
declare r record;starts timestamptz;ends timestamptz;active boolean:=false;forever boolean:=false;src text:='payment';nt text;res public.user_entitlements;
begin
 perform 1 from public.profiles where id=p_user for update;
 for r in select l.* from public.billing_access_ledger l left join public.payment_orders o on o.id=l.order_id
  where l.user_id=p_user and l.voided_at is null and (l.kind<>'payment' or (o.refunded_amount<o.amount and not exists(select 1 from public.payment_disputes d where d.order_id=o.id and d.status<>'won')))
  order by (l.kind='baseline') desc,l.occurred_at,l.id loop
  if r.kind='baseline' then
   if r.baseline_active then active:=true;starts:=r.baseline_starts;ends:=r.baseline_expires;forever:=ends is null;src:=r.source;end if;
  elsif not forever then
   if not active or ends<r.occurred_at then starts:=r.occurred_at;ends:=r.occurred_at;end if;
   ends:=ends+make_interval(months=>r.months);active:=true;src:=r.source;nt:=r.note;
  end if;
 end loop;
 insert into public.user_entitlements(user_id,plan,status,starts_at,expires_at,source,note)
 values(p_user,case when active then 'pro' else 'free' end,'active',coalesce(starts,now()),case when active then ends else null end,case when active then src else 'payment' end,nt)
 on conflict(user_id) do update set plan=excluded.plan,status=excluded.status,starts_at=excluded.starts_at,expires_at=excluded.expires_at,source=excluded.source,note=excluded.note returning * into res;
 return res;
end $$;
create or replace function public.grant_pro(p_user uuid,p_months int,p_source text default 'manual',p_note text default null)
returns public.user_entitlements language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_months<=0 or p_months>1200 or p_source not in ('manual','promo','payment') then raise exception 'invalid grant';end if;
 perform public.billing_capture_baseline(p_user);
 insert into public.billing_access_ledger(user_id,kind,months,source,note) values(p_user,'manual',p_months,p_source,p_note);
 return public.billing_recompute(p_user);
end $$;
create function public.settle_payment(p_order uuid,p_payment text,p_event text,p_mode text,p_amount int,p_currency text,p_test_pro boolean default false)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.payment_orders;env public.billing_environment;new_receipt boolean:=false;
begin
 select * into o from public.payment_orders where id=p_order;
 if not found then raise exception 'unknown order';end if;
 perform 1 from public.profiles where id=o.user_id for update;
 select * into o from public.payment_orders where id=p_order for update;
 select * into env from public.billing_environment where singleton;
 if o.provider_order_id is null or o.mode<>p_mode or env.mode<>p_mode or o.amount<>p_amount or o.currency<>p_currency or p_payment !~ '^pay_[a-zA-Z0-9]+$' or (p_test_pro and (p_mode<>'test' or not env.allow_test_pro)) then raise exception 'invalid order settlement';end if;
 if o.provider_payment_id is not null and o.provider_payment_id<>p_payment then raise exception 'different payment already settled';end if;
 if o.status='creating' then raise exception 'order not ready';end if;
 if o.paid_at is null then
  update public.payment_orders set status='paid',provider_payment_id=p_payment,paid_at=now(),abandoned_at=null where id=o.id;
  new_receipt:=true;
 end if;
 insert into public.payment_events(event_id,order_id,payment_id) values(p_event,o.id,p_payment) on conflict do nothing;
 if p_mode='live' or p_test_pro then
  perform public.billing_capture_baseline(o.user_id);
  insert into public.billing_access_ledger(user_id,order_id,kind,months,source,note,occurred_at)
  select user_id,id,'payment',months,'payment','razorpay:'||p_payment,paid_at from public.payment_orders where id=o.id on conflict(order_id) do nothing;
  perform public.billing_recompute(o.user_id);
 end if;
 return new_receipt;
end $$;
create function public.reconcile_payment(p_order uuid,p_payment text,p_event text,p_refunded int,p_dispute text default null,p_dispute_status text default null,p_event_time bigint default 0)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.payment_orders;
begin
 select * into o from public.payment_orders where id=p_order;
 if not found then raise exception 'unknown order';end if;
 perform 1 from public.profiles where id=o.user_id for update;
 select * into o from public.payment_orders where id=p_order for update;
 if o.provider_payment_id<>p_payment or o.paid_at is null or p_refunded<0 or p_refunded>o.amount then raise exception 'invalid reconciliation';end if;
 update public.payment_orders set refunded_amount=greatest(refunded_amount,p_refunded),status=case when greatest(refunded_amount,p_refunded)=amount then 'refunded' when greatest(refunded_amount,p_refunded)>0 then 'partially_refunded' else 'paid' end where id=o.id;
 if p_dispute is not null then
  if p_dispute !~ '^disp_[a-zA-Z0-9]+$' then raise exception 'invalid dispute';end if;
  insert into public.payment_disputes(id,order_id,status,event_time) values(p_dispute,o.id,p_dispute_status,p_event_time)
  on conflict(id) do update set status=excluded.status,event_time=excluded.event_time,updated_at=now()
  where payment_disputes.order_id=excluded.order_id and excluded.event_time>=payment_disputes.event_time
   and (payment_disputes.status not in ('won','lost','closed') or excluded.status in ('won','lost','closed'));
 end if;
 insert into public.payment_events(event_id,order_id,payment_id,event_type) values(p_event,o.id,p_payment,case when p_dispute is null then 'refund' else 'dispute' end) on conflict do nothing;
 if exists(select 1 from public.billing_access_ledger where order_id=o.id) then perform public.billing_recompute(o.user_id);end if;
end $$;
-- Single transaction even when a refund/dispute notification arrives before capture.
create function public.process_payment(p_order uuid,p_payment text,p_event text,p_mode text,p_amount int,p_currency text,p_refunded int default 0,p_dispute text default null,p_dispute_status text default null,p_event_time bigint default 0,p_test_pro boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid;
begin
 perform public.settle_payment(p_order,p_payment,p_event,p_mode,p_amount,p_currency,p_test_pro);
 perform public.reconcile_payment(p_order,p_payment,p_event,p_refunded,p_dispute,p_dispute_status,p_event_time);
 select user_id into uid from public.payment_orders where id=p_order;
 return jsonb_build_object('confirmed',true,'proGranted',public.has_pro(uid));
end $$;
create function public.record_payment_attempt(p_order uuid,p_payment text,p_event text,p_failed boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_payment !~ '^pay_[a-zA-Z0-9]+$' then raise exception 'invalid attempt';end if;
 insert into public.payment_events(event_id,order_id,payment_id,event_type) values(p_event,p_order,p_payment,'attempt') on conflict do nothing;
 if p_failed then update public.payment_orders set last_failure_at=now() where id=p_order and paid_at is null;end if;
end $$;
create function public.revoke_test_access(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.profiles where id=p_user for update;
 update public.billing_access_ledger l set voided_at=now() from public.payment_orders o where l.order_id=o.id and l.user_id=p_user and o.mode='test';
 perform public.billing_recompute(p_user);
end $$;
-- Explicit function ACLs: no browser/anonymous caller may create receipts or grants.
revoke all on function public.process_payment(uuid,text,text,text,int,text,int,text,text,bigint,boolean),public.record_payment_attempt(uuid,text,text,boolean),public.revoke_test_access(uuid),public.limit_checkout_orders(),public.billing_capture_baseline(uuid),public.billing_recompute(uuid),public.grant_pro(uuid,int,text,text),public.settle_payment(uuid,text,text,text,int,text,boolean),public.reconcile_payment(uuid,text,text,int,text,text,bigint) from public,anon,authenticated;
grant execute on function public.process_payment(uuid,text,text,text,int,text,int,text,text,bigint,boolean),public.record_payment_attempt(uuid,text,text,boolean),public.revoke_test_access(uuid),public.billing_capture_baseline(uuid),public.billing_recompute(uuid),public.grant_pro(uuid,int,text,text),public.settle_payment(uuid,text,text,text,int,text,boolean),public.reconcile_payment(uuid,text,text,int,text,text,bigint) to service_role;
commit;
