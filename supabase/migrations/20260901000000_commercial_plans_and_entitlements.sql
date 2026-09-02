-- FIXAR: COM-1/COM-2 commercial source of truth.
-- Existing organizations are explicitly grandfathered at migration time.

create type public.commercial_plan_code as enum ('free', 'professional', 'team', 'grandfathered');
create type public.commercial_offer_code as enum ('founder', 'annual', 'trial', 'standard');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused', 'incomplete', 'grandfathered');

create table public.commercial_plan_catalog (
  code public.commercial_plan_code primary key,
  display_name text not null check (btrim(display_name) <> ''),
  description text,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  price_cents bigint not null default 0 check (price_cents >= 0),
  currency char(3) not null default 'BRL',
  is_public boolean not null default false,
  limit_users integer,
  limit_customers integer,
  limit_equipment integer,
  limit_qr_codes integer,
  limit_work_orders_monthly integer,
  limit_quotes_monthly integer,
  feature_batch_orders boolean not null default false,
  feature_custom_branding boolean not null default false,
  feature_full_history boolean not null default false,
  history_days integer check (history_days is null or history_days >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commercial_offers (
  code public.commercial_offer_code primary key,
  display_name text not null check (btrim(display_name) <> ''),
  price_cents bigint not null check (price_cents >= 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code public.commercial_plan_code not null references public.commercial_plan_catalog(code),
  offer_code public.commercial_offer_code references public.commercial_offers(code),
  subscription_status public.subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table public.organization_plan_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_code public.commercial_plan_code not null references public.commercial_plan_catalog(code),
  offer_code public.commercial_offer_code references public.commercial_offers(code),
  limit_users integer,
  limit_customers integer,
  limit_equipment integer,
  limit_qr_codes integer,
  limit_work_orders_monthly integer,
  limit_quotes_monthly integer,
  feature_batch_orders boolean,
  feature_custom_branding boolean,
  feature_full_history boolean,
  history_days integer check (history_days is null or history_days >= 0),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commercial_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  entity_type text not null check (entity_type in ('subscription', 'override', 'plan_catalog', 'offer')),
  action text not null check (btrim(action) <> ''),
  previous_plan_code public.commercial_plan_code,
  new_plan_code public.commercial_plan_code,
  previous_status public.subscription_status,
  new_status public.subscription_status,
  offer_code public.commercial_offer_code,
  price_cents bigint check (price_cents is null or price_cents >= 0),
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.commercial_plan_catalog (
  code, display_name, description, billing_cycle, price_cents, currency, is_public,
  limit_users, limit_customers, limit_equipment, limit_qr_codes,
  limit_work_orders_monthly, limit_quotes_monthly,
  feature_batch_orders, feature_custom_branding, feature_full_history, history_days
) values
  ('free', 'Free', 'Plano inicial para operação simples e controle básico.', 'monthly', 0, 'BRL', true, 1, 10, 15, 5, 5, 3, false, false, false, 30),
  ('professional', 'Professional', 'Plano profissional com operação completa.', 'monthly', 0, 'BRL', true, 3, null, null, 100, null, null, true, true, true, 365),
  ('team', 'Team', 'Plano para equipes em maior escala.', 'monthly', 0, 'BRL', true, 10, null, null, 500, null, null, true, true, true, 365),
  ('grandfathered', 'Grandfathered', 'Organização existente preservada sem bloqueio.', 'monthly', 0, 'BRL', false, null, null, null, null, null, null, true, true, true, null);

insert into public.commercial_offers (code, display_name, price_cents, billing_cycle)
values
  ('founder', 'Founder', 2990, 'monthly'),
  ('annual', 'Annual', 0, 'annual'),
  ('trial', 'Trial', 0, 'monthly'),
  ('standard', 'Standard', 0, 'monthly');

-- Snapshot boundary: every organization existing now is explicitly preserved.
insert into public.organization_subscriptions (organization_id, plan_code, subscription_status)
select id, 'grandfathered', 'grandfathered'
from public.organizations
where deleted_at is null
on conflict (organization_id) do nothing;

create or replace function private.create_default_subscription()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.organization_subscriptions (organization_id, plan_code, subscription_status)
  values (new.id, 'free', 'active') on conflict (organization_id) do nothing;
  return new;
end;
$$;

create trigger organizations_create_default_subscription
after insert on public.organizations
for each row execute function private.create_default_subscription();

create or replace function private.log_commercial_subscription_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.commercial_audit_log (
    organization_id, entity_type, action, previous_plan_code, new_plan_code,
    previous_status, new_status, offer_code, price_cents, actor_id, details
  ) values (
    new.organization_id, 'subscription', tg_op,
    case when tg_op = 'UPDATE' then old.plan_code end, new.plan_code,
    case when tg_op = 'UPDATE' then old.subscription_status end, new.subscription_status,
    new.offer_code,
    coalesce((select price_cents from public.commercial_offers offer where offer.code = new.offer_code), (select price_cents from public.commercial_plan_catalog catalog where catalog.code = new.plan_code)),
    auth.uid(), jsonb_build_object('subscription_id', new.id)
  );
  return new;
end;
$$;

create trigger organization_subscriptions_audit
after insert or update on public.organization_subscriptions
for each row execute function private.log_commercial_subscription_change();

create or replace function private.log_commercial_override_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.commercial_audit_log (
    organization_id, entity_type, action, previous_plan_code, new_plan_code,
    offer_code, actor_id, reason, details
  ) values (
    new.organization_id, 'override', tg_op,
    case when tg_op = 'UPDATE' then old.plan_code end, new.plan_code,
    new.offer_code, auth.uid(), new.notes,
    jsonb_build_object('override_id', new.id, 'record', to_jsonb(new))
  );
  return new;
end;
$$;

create trigger organization_plan_overrides_audit
after insert or update on public.organization_plan_overrides
for each row execute function private.log_commercial_override_change();

revoke all on function private.create_default_subscription() from public, anon, authenticated, service_role;
revoke all on function private.log_commercial_subscription_change() from public, anon, authenticated, service_role;
revoke all on function private.log_commercial_override_change() from public, anon, authenticated, service_role;

alter table public.commercial_plan_catalog enable row level security;
alter table public.commercial_offers enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_plan_overrides enable row level security;
alter table public.commercial_audit_log enable row level security;

revoke all on table public.commercial_plan_catalog, public.commercial_offers,
  public.organization_subscriptions, public.organization_plan_overrides,
  public.commercial_audit_log from public, anon, authenticated;
grant select on public.commercial_plan_catalog to authenticated;
grant select on public.organization_subscriptions, public.organization_plan_overrides to authenticated;
grant select on public.commercial_audit_log to authenticated;

create policy commercial_plan_catalog_select on public.commercial_plan_catalog
for select to authenticated using (is_active and is_public);
create policy organization_subscriptions_select_member on public.organization_subscriptions
for select to authenticated using (private.is_organization_member(organization_id));
create policy organization_plan_overrides_select_member on public.organization_plan_overrides
for select to authenticated using (private.is_organization_member(organization_id));
create policy commercial_audit_log_select_admin on public.commercial_audit_log
for select to authenticated using (organization_id is not null and private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create index organization_plan_overrides_org_active_idx
  on public.organization_plan_overrides (organization_id, active, updated_at desc);
create index commercial_audit_log_org_created_idx
  on public.commercial_audit_log (organization_id, created_at desc);

create or replace function private.get_effective_organization_entitlements(p_organization_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'plan_code', coalesce(subscription.plan_code, 'free'::public.commercial_plan_code),
    'offer_code', coalesce(plan_override.offer_code, subscription.offer_code),
    'subscription_status', coalesce(subscription.subscription_status, 'active'::public.subscription_status),
    'display_name', catalog.display_name,
    'billing_cycle', coalesce(offer.billing_cycle, catalog.billing_cycle),
    'price_cents', coalesce(offer.price_cents, catalog.price_cents),
    'limits', jsonb_build_object(
      'users', coalesce(plan_override.limit_users, catalog.limit_users),
      'customers', coalesce(plan_override.limit_customers, catalog.limit_customers),
      'equipment', coalesce(plan_override.limit_equipment, catalog.limit_equipment),
      'qr_codes', coalesce(plan_override.limit_qr_codes, catalog.limit_qr_codes),
      'work_orders_monthly', coalesce(plan_override.limit_work_orders_monthly, catalog.limit_work_orders_monthly),
      'quotes_monthly', coalesce(plan_override.limit_quotes_monthly, catalog.limit_quotes_monthly)
    ),
    'features', jsonb_build_object(
      'batch_orders', coalesce(plan_override.feature_batch_orders, catalog.feature_batch_orders),
      'custom_branding', coalesce(plan_override.feature_custom_branding, catalog.feature_custom_branding),
      'full_history', coalesce(plan_override.feature_full_history, catalog.feature_full_history)
    ),
    'history_days', coalesce(plan_override.history_days, catalog.history_days)
  )
  from public.organizations organization
  left join public.organization_subscriptions subscription on subscription.organization_id = organization.id
  left join lateral (
    select * from public.organization_plan_overrides candidate
    where candidate.organization_id = organization.id and candidate.active
    order by candidate.updated_at desc limit 1
  ) plan_override on true
  join public.commercial_plan_catalog catalog on catalog.code = coalesce(subscription.plan_code, 'free'::public.commercial_plan_code)
  left join public.commercial_offers offer on offer.code = coalesce(plan_override.offer_code, subscription.offer_code)
  where organization.id = p_organization_id;
$$;

create or replace function public.get_current_organization_entitlements(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_organization_member(p_organization_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return private.get_effective_organization_entitlements(p_organization_id);
end;
$$;

create or replace function private.get_organization_commercial_usage(p_organization_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with bounds as (
    select date_trunc('month', now() at time zone 'UTC') at time zone 'UTC' month_start,
      (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC' next_month
  ), qr as (
    select public_token from public.generated_qr_codes where organization_id = p_organization_id
    union
    select public_token from public.equipment_public_links where organization_id = p_organization_id
  )
  select jsonb_build_object(
    'customers', (select count(*) from public.customers where organization_id = p_organization_id and deleted_at is null),
    'equipment', (select count(*) from public.assets where organization_id = p_organization_id and deleted_at is null),
    'qr_codes', (select count(*) from qr),
    'work_orders_monthly', (select count(*) from public.work_orders, bounds where organization_id = p_organization_id and deleted_at is null and created_at >= month_start and created_at < next_month),
    'quotes_monthly', (select count(*) from public.quotes, bounds where organization_id = p_organization_id and deleted_at is null and created_at >= month_start and created_at < next_month),
    'timezone', 'UTC'
  );
$$;

create or replace function public.get_current_organization_commercial_usage(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_organization_member(p_organization_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return private.get_organization_commercial_usage(p_organization_id);
end;
$$;

revoke all on function private.get_effective_organization_entitlements(uuid) from public, anon, authenticated;
revoke all on function private.get_organization_commercial_usage(uuid) from public, anon, authenticated;
revoke all on function public.get_current_organization_entitlements(uuid) from public, anon;
revoke all on function public.get_current_organization_commercial_usage(uuid) from public, anon;
grant execute on function public.get_current_organization_entitlements(uuid) to authenticated;
grant execute on function public.get_current_organization_commercial_usage(uuid) to authenticated;

comment on function private.get_organization_commercial_usage(uuid) is
  'Counts active customers/assets, distinct permanent QR identities, and non-deleted monthly records in UTC. UNION removes reserved/linked QR duplicates.';
