create or replace function public.create_asset_with_reserved_qr(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_organization_id uuid := ($1->>'organizationId')::uuid;
declare created_asset_id uuid;
declare reservation record;
begin
  if not private.has_organization_role(target_organization_id, array['owner','admin']::public.organization_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.assets (
    organization_id, customer_id, reference, model, brand, location, equipment_type,
    serial_number, capacity_btu, voltage, phase, refrigerant, installed_at
  ) values (
    target_organization_id, ($1->>'customerId')::uuid, upper(btrim($1->>'reference')),
    nullif($1->>'model',''), nullif($1->>'brand',''), $1->>'location',
    nullif($1->>'equipmentType',''), nullif($1->>'serialNumber',''),
    nullif($1->>'capacityBtu','')::integer, nullif($1->>'voltage','')::integer,
    nullif($1->>'phase',''), nullif($1->>'refrigerant',''),
    nullif($1->>'installedAt','')::date
  ) returning id into created_asset_id;

  select qr.id, qr.public_token into reservation
  from public.generated_qr_codes qr
  where qr.organization_id = target_organization_id
    and qr.reference = upper(btrim($1->>'reference')) and qr.asset_id is null
  for update;

  if reservation.id is not null then
    update public.equipment_public_links set public_token = reservation.public_token
    where organization_id = target_organization_id and asset_id = created_asset_id;
    update public.generated_qr_codes set asset_id = created_asset_id, claimed_at = now()
    where id = reservation.id;
  end if;
  return created_asset_id;
end;
$$;

create or replace function public.platform_admin_equipment_qr_codes(target_organization_id uuid default null)
returns table (
  id uuid, public_token text, enabled boolean, asset_id uuid, reference text,
  organization_id uuid, organization_name text, brand text, model text, location text
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query
  select link.id, link.public_token::text, true, asset.id, asset.reference,
    organization.id, organization.name, asset.brand, asset.model, asset.location
  from public.equipment_public_links link
  join public.assets asset on asset.organization_id = link.organization_id and asset.id = link.asset_id
  join public.organizations organization on organization.id = link.organization_id
  where asset.deleted_at is null and organization.deleted_at is null
    and (target_organization_id is null or link.organization_id = target_organization_id)
  union all
  select qr.id, qr.public_token::text, true, null::uuid, qr.reference,
    organization.id, organization.name, null::text, null::text, 'Aguardando cadastro'::text
  from public.generated_qr_codes qr
  join public.organizations organization on organization.id = qr.organization_id
  where qr.asset_id is null and organization.deleted_at is null
    and (target_organization_id is null or qr.organization_id = target_organization_id)
  order by 7, 5;
end;
$$;
