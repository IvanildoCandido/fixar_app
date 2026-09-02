-- QR usage correction: automatic links for soft-deleted assets are not valid
-- commercial identities. Reserved generated QR rows remain authoritative.

create or replace function private.get_organization_commercial_usage(p_organization_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with bounds as (
    select date_trunc('month', now() at time zone 'UTC') at time zone 'UTC' month_start,
      (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC' next_month
  ), qr as (
    select public_token
    from public.generated_qr_codes
    where organization_id = p_organization_id
    union
    select link.public_token
    from public.equipment_public_links link
    join public.assets asset
      on asset.organization_id = link.organization_id and asset.id = link.asset_id
    where link.organization_id = p_organization_id and asset.deleted_at is null
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

comment on function private.get_organization_commercial_usage(uuid) is
  'Counts active customers/assets, distinct permanent QR identities, and non-deleted monthly records in UTC. Reserved generated QR rows count; equipment links count only when their asset is active; UNION removes duplicates.';
