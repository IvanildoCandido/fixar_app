-- Equipment QR identities are permanent public URLs. Visibility is no longer configurable.
alter table public.equipment_public_links
  alter column enabled set default true;

update public.equipment_public_links
set enabled = true
where enabled = false;

create or replace function public.manage_equipment_public_link(
  target_asset_id uuid,
  next_enabled boolean default null,
  rotate_token boolean default false
) returns table (public_token uuid, enabled boolean)
language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid;
begin
  select asset.organization_id into target_organization_id
  from public.assets asset
  where asset.id = target_asset_id and asset.deleted_at is null;

  if target_organization_id is null or not private.has_organization_role(
    target_organization_id, array['owner','admin','technician']::public.organization_role[]
  ) then
    raise exception 'Equipment unavailable' using errcode = '42501';
  end if;

  insert into public.equipment_public_links (organization_id, asset_id, enabled)
  values (target_organization_id, target_asset_id, true)
  on conflict (organization_id, asset_id) do update set enabled = true;

  return query
  select link.public_token, true
  from public.equipment_public_links link
  where link.organization_id = target_organization_id and link.asset_id = target_asset_id;
end;
$$;

create or replace function public.get_public_equipment(token text)
returns jsonb
language sql stable security definer set search_path = '' as $$
  with target as (
    select link.organization_id, link.asset_id
    from public.equipment_public_links link
    join public.assets asset on asset.organization_id = link.organization_id and asset.id = link.asset_id
    join public.organizations organization on organization.id = link.organization_id
    where link.public_token::text = token
      and asset.deleted_at is null and organization.deleted_at is null
  ), history as (
    select work_order.id, work_order.completed_at,
      coalesce(jsonb_agg(item.name order by item.created_at) filter (where item.id is not null), '[]'::jsonb) services
    from target
    join public.work_orders work_order on work_order.organization_id = target.organization_id
      and work_order.asset_id = target.asset_id and work_order.deleted_at is null
      and work_order.completed_at is not null
    left join public.work_order_items item on item.organization_id = work_order.organization_id
      and item.work_order_id = work_order.id and item.kind = 'service'
    group by work_order.id, work_order.completed_at
    order by work_order.completed_at desc
    limit 10
  ), next_maintenance as (
    select min(work_order.reminder_due_at) due_at
    from target
    join public.work_orders work_order on work_order.organization_id = target.organization_id
      and work_order.asset_id = target.asset_id and work_order.deleted_at is null
      and work_order.reminder_enabled and work_order.reminder_due_at is not null
  )
  select jsonb_build_object(
    'organization', jsonb_build_object('name', organization.name, 'logo_path', organization.logo_path, 'phone', organization.phone),
    'equipment', jsonb_build_object('reference', asset.reference, 'type', asset.equipment_type, 'brand', asset.brand,
      'model', asset.model, 'capacity_btu', asset.capacity_btu, 'location', asset.location),
    'last_maintenance', (select jsonb_build_object('date', h.completed_at, 'services', h.services, 'status', 'completed') from history h order by h.completed_at desc limit 1),
    'next_maintenance', (select jsonb_build_object('date', n.due_at) from next_maintenance n where n.due_at is not null),
    'history', coalesce((select jsonb_agg(jsonb_build_object('date', h.completed_at, 'services', h.services, 'status', 'completed') order by h.completed_at desc) from history h), '[]'::jsonb)
  )
  from target
  join public.organizations organization on organization.id = target.organization_id
  join public.assets asset on asset.organization_id = target.organization_id and asset.id = target.asset_id;
$$;

comment on column public.equipment_public_links.enabled is
  'Legacy compatibility flag. Equipment QR identities are always public and this value remains true.';
