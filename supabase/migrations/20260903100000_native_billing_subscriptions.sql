-- Native store billing. Store tokens and provider identifiers remain server-only.
alter table public.organization_subscriptions
  add column if not exists provider text not null default 'manual'
    check (provider in ('manual', 'google_play', 'app_store')),
  add column if not exists provider_product_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_purchase_token text,
  add column if not exists provider_original_transaction_id text,
  add column if not exists provider_environment text
    check (provider_environment is null or provider_environment in ('sandbox', 'production')),
  add column if not exists provider_latest_order_id text,
  add column if not exists auto_renew boolean,
  add column if not exists last_verified_at timestamptz;

create unique index if not exists organization_subscriptions_provider_token_uidx
  on public.organization_subscriptions (provider, provider_purchase_token)
  where provider_purchase_token is not null;
create unique index if not exists organization_subscriptions_provider_original_tx_uidx
  on public.organization_subscriptions (provider, provider_original_transaction_id)
  where provider_original_transaction_id is not null;

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_play', 'app_store')),
  external_event_id text not null,
  payload_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);
alter table public.billing_webhook_events enable row level security;
revoke all on table public.billing_webhook_events from public, anon, authenticated;

-- Store prices are the runtime authority; these values are only controlled catalog references.
update public.commercial_plan_catalog set price_cents = 3990 where code = 'professional';
update public.commercial_plan_catalog set price_cents = 7990 where code = 'team';

create or replace function public.get_current_organization_entitlements(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_organization_member(p_organization_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return jsonb_set(
    private.get_effective_organization_entitlements(p_organization_id),
    '{provider}', to_jsonb((select provider from public.organization_subscriptions where organization_id = p_organization_id)), true
  ) || jsonb_build_object(
    'provider_product_id', (select provider_product_id from public.organization_subscriptions where organization_id = p_organization_id),
    'current_period_end', (select current_period_end from public.organization_subscriptions where organization_id = p_organization_id),
    'cancel_at_period_end', coalesce((select cancel_at_period_end from public.organization_subscriptions where organization_id = p_organization_id), false),
    'auto_renew', (select auto_renew from public.organization_subscriptions where organization_id = p_organization_id)
  );
end;
$$;

revoke all on function public.get_current_organization_entitlements(uuid) from public, anon;
grant execute on function public.get_current_organization_entitlements(uuid) to authenticated;

-- Expose provider state to the protected Global Admin view without exposing tokens.
create or replace function public.platform_admin_commercial_organizations()
returns setof jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,'created_at',o.created_at,
    'customers',(select count(*) from public.customers c where c.organization_id=o.id and c.deleted_at is null),
    'assets',(select count(*) from public.assets a where a.organization_id=o.id and a.deleted_at is null),
    'work_orders',(select count(*) from public.work_orders w where w.organization_id=o.id and w.deleted_at is null),
    'members',(select count(*) from public.organization_members m where m.organization_id=o.id and m.status='active'),
    'qr_codes',(private.get_organization_commercial_usage(o.id)->>'qr_codes')::bigint,
    'last_activity',(select max(w.created_at) from public.work_orders w where w.organization_id=o.id),
    'entitlements',private.get_effective_organization_entitlements(o.id) || coalesce((select jsonb_build_object(
      'provider',s.provider,'provider_product_id',s.provider_product_id,'current_period_end',s.current_period_end,
      'cancel_at_period_end',s.cancel_at_period_end,'auto_renew',s.auto_renew,'last_verified_at',s.last_verified_at)
      from public.organization_subscriptions s where s.organization_id=o.id),'{}'::jsonb),
    'usage',private.get_organization_commercial_usage(o.id))
  from public.organizations o where o.deleted_at is null and private.is_platform_admin() order by o.name;
$$;
revoke all on function public.platform_admin_commercial_organizations() from public,anon;
grant execute on function public.platform_admin_commercial_organizations() to authenticated;
