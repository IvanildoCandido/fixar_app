-- Fix parameter/column ambiguity in the equipment creation RPC.
drop function public.create_asset_with_reserved_qr(jsonb);
create function public.create_asset_with_reserved_qr(p_payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid := (p_payload->>'organizationId')::uuid;
  created_asset_id uuid;
  reservation record;
begin
  if not private.has_organization_role(target_organization_id, array['owner','admin']::public.organization_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform private.assert_can_create_resource(target_organization_id, 'equipment', 1);
  select qr.id, qr.public_token into reservation
  from public.generated_qr_codes qr
  where qr.organization_id = target_organization_id
    and qr.reference = upper(btrim(p_payload->>'reference')) and qr.asset_id is null
  for update;
  if reservation.id is null then perform private.assert_can_create_resource(target_organization_id, 'qr_code', 1); end if;
  insert into public.assets (
    organization_id, customer_id, reference, model, brand, location, equipment_type,
    serial_number, capacity_btu, voltage, phase, refrigerant, installed_at
  ) values (
    target_organization_id, (p_payload->>'customerId')::uuid, upper(btrim(p_payload->>'reference')),
    nullif(p_payload->>'model',''), nullif(p_payload->>'brand',''), p_payload->>'location',
    nullif(p_payload->>'equipmentType',''), nullif(p_payload->>'serialNumber',''),
    nullif(p_payload->>'capacityBtu','')::integer, nullif(p_payload->>'voltage','')::integer,
    nullif(p_payload->>'phase',''), nullif(p_payload->>'refrigerant',''),
    nullif(p_payload->>'installedAt','')::date
  ) returning id into created_asset_id;
  if reservation.id is not null then
    update public.equipment_public_links set public_token = reservation.public_token
    where organization_id = target_organization_id and asset_id = created_asset_id;
    update public.generated_qr_codes set asset_id = created_asset_id, claimed_at = now()
    where id = reservation.id;
  end if;
  return created_asset_id;
end;
$$;
revoke all on function public.create_asset_with_reserved_qr(jsonb) from public, anon;
grant execute on function public.create_asset_with_reserved_qr(jsonb) to authenticated;
;
