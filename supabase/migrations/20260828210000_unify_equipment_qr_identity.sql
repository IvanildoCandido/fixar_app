-- Every asset has one stable QR identity, regardless of public visibility.
insert into public.equipment_public_links (organization_id, asset_id)
select asset.organization_id, asset.id
from public.assets asset
where asset.deleted_at is null
on conflict (organization_id, asset_id) do nothing;

create or replace function private.ensure_equipment_qr_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.equipment_public_links (organization_id, asset_id)
  values (new.organization_id, new.id)
  on conflict (organization_id, asset_id) do nothing;
  return new;
end;
$$;

revoke all on function private.ensure_equipment_qr_identity() from public, anon, authenticated, service_role;

create trigger assets_ensure_qr_identity
after insert on public.assets
for each row execute function private.ensure_equipment_qr_identity();

create or replace function public.resolve_equipment_qr(
  token text,
  target_organization_id uuid
) returns text
language sql stable security invoker set search_path = '' as $$
  select asset.reference
  from public.equipment_public_links link
  join public.assets asset on asset.organization_id = link.organization_id and asset.id = link.asset_id
  where link.public_token::text = token
    and link.organization_id = target_organization_id
    and asset.deleted_at is null
    and private.is_organization_member(target_organization_id)
  limit 1;
$$;

revoke all on function public.resolve_equipment_qr(text, uuid) from public, anon;
grant execute on function public.resolve_equipment_qr(text, uuid) to authenticated;

comment on function public.resolve_equipment_qr(text, uuid) is
  'Resolves the stable equipment QR inside the authenticated active organization. Public enabled state is intentionally ignored.';

create or replace function public.platform_admin_equipment_qr_codes(target_organization_id uuid default null)
returns table (
  id uuid, public_token text, enabled boolean, asset_id uuid, reference text,
  organization_id uuid, organization_name text, brand text, model text, location text
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query
  select link.id, link.public_token::text, link.enabled, asset.id, asset.reference,
    organization.id, organization.name, asset.brand, asset.model, asset.location
  from public.equipment_public_links link
  join public.assets asset on asset.organization_id = link.organization_id and asset.id = link.asset_id
  join public.organizations organization on organization.id = link.organization_id
  where asset.deleted_at is null and organization.deleted_at is null
    and (target_organization_id is null or link.organization_id = target_organization_id)
  order by organization.name, asset.reference;
end;
$$;

revoke all on function public.platform_admin_equipment_qr_codes(uuid) from public, anon;
grant execute on function public.platform_admin_equipment_qr_codes(uuid) to authenticated;

create or replace function public.platform_admin_metrics()
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare result jsonb;
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from auth.users),
    'organizations', (select count(*) from public.organizations where deleted_at is null),
    'customers', (select count(*) from public.customers where deleted_at is null),
    'assets', (select count(*) from public.assets where deleted_at is null),
    'work_orders', (select count(*) from public.work_orders where deleted_at is null),
    'qr_codes', (select count(*) from public.equipment_public_links link join public.assets asset on asset.id = link.asset_id and asset.organization_id = link.organization_id where asset.deleted_at is null),
    'storage_files', (select count(*) from storage.objects),
    'storage_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0)
  ) into result;
  return result;
end;
$$;

create or replace function public.platform_admin_organizations()
returns table (
  id uuid, name text, email text, phone text, created_at timestamptz,
  customers bigint, assets bigint, work_orders bigint, members bigint, qr_codes bigint
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query select organization.id, organization.name, organization.email, organization.phone, organization.created_at,
    (select count(*) from public.customers customer where customer.organization_id = organization.id and customer.deleted_at is null),
    (select count(*) from public.assets asset where asset.organization_id = organization.id and asset.deleted_at is null),
    (select count(*) from public.work_orders work_order where work_order.organization_id = organization.id and work_order.deleted_at is null),
    (select count(*) from public.organization_members member where member.organization_id = organization.id and member.status = 'active'),
    (select count(*) from public.equipment_public_links link join public.assets asset on asset.id = link.asset_id and asset.organization_id = link.organization_id where link.organization_id = organization.id and asset.deleted_at is null)
  from public.organizations organization where organization.deleted_at is null order by organization.name;
end;
$$;
