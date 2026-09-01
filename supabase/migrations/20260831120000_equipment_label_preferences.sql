create table public.organization_label_preferences (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  width_mm integer not null default 60 check (width_mm between 30 and 150),
  height_mm integer not null default 40 check (height_mm between 20 and 100),
  show_organization_phone boolean not null default true,
  show_equipment_type boolean not null default true,
  show_brand_model boolean not null default true,
  show_location boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.organization_label_preferences enable row level security;
grant select, insert, update on public.organization_label_preferences to authenticated;

create policy organization_label_preferences_select_member
on public.organization_label_preferences for select to authenticated
using (private.is_organization_member(organization_id));

create policy organization_label_preferences_insert_admin
on public.organization_label_preferences for insert to authenticated
with check (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]));

create policy organization_label_preferences_update_admin
on public.organization_label_preferences for update to authenticated
using (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]));

create trigger organization_label_preferences_set_updated_at
before update on public.organization_label_preferences
for each row execute function public.set_updated_at();

-- Pre-generated labels remain organization-owned reservations until an asset claims them.
alter table public.generated_qr_codes
  add column if not exists public_token uuid default gen_random_uuid(),
  add column if not exists asset_id uuid,
  add column if not exists claimed_at timestamptz;

update public.generated_qr_codes set public_token = gen_random_uuid() where public_token is null;
alter table public.generated_qr_codes alter column public_token set not null;
alter table public.generated_qr_codes drop constraint if exists generated_qr_codes_reference_unique;
alter table public.generated_qr_codes
  add constraint generated_qr_codes_public_token_unique unique (public_token),
  add constraint generated_qr_codes_organization_reference_unique unique (organization_id, reference),
  add constraint generated_qr_codes_asset_fk foreign key (organization_id, asset_id)
    references public.assets (organization_id, id) on delete restrict;

create policy generated_qr_codes_member_read on public.generated_qr_codes
for select to authenticated using (private.is_organization_member(organization_id));

create or replace function public.reserve_equipment_qr_codes(target_organization_id uuid, requested_references text[])
returns table (id uuid, reference text, public_token text, asset_id uuid)
language plpgsql security definer set search_path = '' as $$
declare requested_reference text;
begin
  if coalesce(array_length(requested_references, 1), 0) not between 1 and 24 then
    raise exception 'Quantity must be between 1 and 24' using errcode = '22023';
  end if;
  if not private.is_platform_admin() and not private.has_organization_role(
    target_organization_id, array['owner','admin','technician']::public.organization_role[]
  ) then raise exception 'Not authorized' using errcode = '42501'; end if;

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

revoke all on function public.reserve_equipment_qr_codes(uuid, text[]) from public, anon;
grant execute on function public.reserve_equipment_qr_codes(uuid, text[]) to authenticated;

create or replace function public.resolve_qr_for_registration(token text, target_organization_id uuid)
returns text language sql stable security invoker set search_path = '' as $$
  select qr.reference from public.generated_qr_codes qr
  where qr.public_token::text = token and qr.organization_id = target_organization_id
    and private.is_organization_member(target_organization_id)
  limit 1;
$$;

revoke all on function public.resolve_qr_for_registration(text, uuid) from public, anon;
grant execute on function public.resolve_qr_for_registration(text, uuid) to authenticated;

create or replace function public.create_asset_with_reserved_qr(payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_organization_id uuid := (payload->>'organizationId')::uuid;
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
    target_organization_id, (payload->>'customerId')::uuid, upper(btrim(payload->>'reference')),
    nullif(payload->>'model',''), nullif(payload->>'brand',''), payload->>'location',
    nullif(payload->>'equipmentType',''), nullif(payload->>'serialNumber',''),
    nullif(payload->>'capacityBtu','')::integer, nullif(payload->>'voltage','')::integer,
    nullif(payload->>'phase',''), nullif(payload->>'refrigerant',''),
    nullif(payload->>'installedAt','')::date
  ) returning id into created_asset_id;

  select qr.id, qr.public_token into reservation
  from public.generated_qr_codes qr
  where qr.organization_id = target_organization_id
    and qr.reference = upper(btrim(payload->>'reference')) and qr.asset_id is null
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

revoke all on function public.create_asset_with_reserved_qr(jsonb) from public, anon;
grant execute on function public.create_asset_with_reserved_qr(jsonb) to authenticated;

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
  order by organization_name, reference;
end;
$$;

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
    'qr_codes',
      (select count(*) from public.equipment_public_links link join public.assets asset on asset.id = link.asset_id and asset.organization_id = link.organization_id where asset.deleted_at is null)
      + (select count(*) from public.generated_qr_codes qr where qr.asset_id is null),
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
      + (select count(*) from public.generated_qr_codes qr where qr.organization_id = organization.id and qr.asset_id is null)
  from public.organizations organization where organization.deleted_at is null order by organization.name;
end;
$$;
