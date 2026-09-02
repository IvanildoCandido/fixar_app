-- COM-3: authoritative enforcement for customers, equipment and QR identities.
-- Orders, offline, quotes, history, branding and team limits remain out of scope.

create or replace function private.assert_can_create_resource(
  p_organization_id uuid,
  p_resource text,
  p_requested integer default 1
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  entitlements jsonb;
  usage jsonb;
  limit_value integer;
  usage_value integer;
begin
  if p_requested < 1 or p_resource not in ('customer', 'equipment', 'qr_code') then
    raise exception 'Invalid commercial resource' using errcode = '22023';
  end if;
  if not private.is_platform_admin() and not private.is_organization_member(p_organization_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- All mutations for a tenant serialize on the same transaction advisory lock.
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text, 0));
  entitlements := private.get_effective_organization_entitlements(p_organization_id);
  usage := private.get_organization_commercial_usage(p_organization_id);
  limit_value := case p_resource
    when 'customer' then (entitlements->'limits'->>'customers')::integer
    when 'equipment' then (entitlements->'limits'->>'equipment')::integer
    when 'qr_code' then (entitlements->'limits'->>'qr_codes')::integer
  end;
  usage_value := case p_resource
    when 'customer' then (usage->>'customers')::integer
    when 'equipment' then (usage->>'equipment')::integer
    when 'qr_code' then (usage->>'qr_codes')::integer
  end;

  if limit_value is not null and usage_value + p_requested > limit_value then
    raise exception using
      message = 'PLAN_LIMIT_REACHED',
      detail = jsonb_build_object(
        'code', 'PLAN_LIMIT_REACHED',
        'resource', p_resource,
        'usage', usage_value,
        'limit', limit_value,
        'requested', p_requested,
        'plan_code', entitlements->>'plan_code'
      )::text,
      errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.create_customer(payload jsonb)
returns public.customers
language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid := (payload->>'organizationId')::uuid;
  created_customer public.customers;
begin
  if not private.has_organization_role(target_organization_id, array['owner','admin']::public.organization_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform private.assert_can_create_resource(target_organization_id, 'customer', 1);
  insert into public.customers (organization_id, name, email, phone, address, document)
  values (
    target_organization_id,
    btrim(payload->>'name'), nullif(payload->>'email', ''), nullif(payload->>'phone', ''),
    nullif(payload->>'address', ''), nullif(payload->>'document', '')
  ) returning * into created_customer;
  return created_customer;
end;
$$;

create or replace function public.reserve_equipment_qr_codes(target_organization_id uuid, requested_references text[])
returns table (id uuid, reference text, public_token text, asset_id uuid)
language plpgsql security definer set search_path = '' as $$
declare requested_reference text;
  requested_count integer := coalesce(array_length(requested_references, 1), 0);
begin
  if requested_count not between 1 and 24 then
    raise exception 'Quantity must be between 1 and 24' using errcode = '22023';
  end if;
  if not private.is_platform_admin() and not private.has_organization_role(
    target_organization_id, array['owner','admin','technician']::public.organization_role[]
  ) then raise exception 'Not authorized' using errcode = '42501'; end if;
  perform private.assert_can_create_resource(target_organization_id, 'qr_code', requested_count);

  foreach requested_reference in array requested_references loop
    requested_reference := upper(btrim(requested_reference));
    if char_length(requested_reference) <> 7 then
      raise exception 'Reference must have 7 characters' using errcode = '22023';
    end if;
    insert into public.generated_qr_codes (reference, payload, generated_by, organization_id)
    values (requested_reference, 'FIXAR|EQUIPMENT|' || requested_reference, auth.uid(), target_organization_id);
  end loop;

  return query select qr.id, qr.reference, qr.public_token::text, qr.asset_id
  from public.generated_qr_codes qr
  where qr.organization_id = target_organization_id and qr.reference = any(requested_references)
  order by qr.created_at;
end;
$$;

create or replace function public.create_asset_with_reserved_qr(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid := (payload->>'organizationId')::uuid;
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
    and qr.reference = upper(btrim(payload->>'reference')) and qr.asset_id is null
  for update;
  if reservation.id is null then
    perform private.assert_can_create_resource(target_organization_id, 'qr_code', 1);
  end if;

  insert into public.assets (
    organization_id, customer_id, reference, model, brand, location, equipment_type,
    serial_number, capacity_btu, voltage, phase, refrigerant, installed_at
  ) values (
    target_organization_id, (payload->>'customerId')::uuid, upper(btrim(payload->>'reference')),
    nullif(payload->>'model',''), nullif(payload->>'brand',''), payload->>'location',
    nullif(payload->>'equipmentType',''), nullif(payload->>'serialNumber',''),
    nullif(payload->>'capacityBtu','')::integer, nullif(payload->>'voltage','')::integer,
    nullif(payload->>'phase',''), nullif(payload->>'refrigerant',''),
    nullif(payload->>'installedAt','')::date
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

create or replace function private.enforce_customer_restore()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.deleted_at is not null and new.deleted_at is null then
    perform private.assert_can_create_resource(new.organization_id, 'customer', 1);
  end if;
  return new;
end;
$$;

create or replace function private.enforce_equipment_restore()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.deleted_at is not null and new.deleted_at is null then
    perform private.assert_can_create_resource(new.organization_id, 'equipment', 1);
  end if;
  return new;
end;
$$;

create trigger customers_commercial_restore
before update on public.customers
for each row execute function private.enforce_customer_restore();
create trigger assets_commercial_restore
before update on public.assets
for each row execute function private.enforce_equipment_restore();

revoke insert on table public.customers, public.assets from authenticated;
revoke all on function private.assert_can_create_resource(uuid, text, integer) from public, anon, authenticated;
revoke all on function private.enforce_customer_restore() from public, anon, authenticated;
revoke all on function private.enforce_equipment_restore() from public, anon, authenticated;
revoke all on function public.create_customer(jsonb) from public, anon;
grant execute on function public.create_customer(jsonb) to authenticated;
revoke all on function public.reserve_equipment_qr_codes(uuid, text[]) from public, anon;
grant execute on function public.reserve_equipment_qr_codes(uuid, text[]) to authenticated;
revoke all on function public.create_asset_with_reserved_qr(jsonb) from public, anon;
grant execute on function public.create_asset_with_reserved_qr(jsonb) to authenticated;

comment on function private.assert_can_create_resource(uuid, text, integer) is
  'Central transactional COM-3 quota guard for customer, equipment and qr_code. Raises PLAN_LIMIT_REACHED with structured detail.';
