-- Public equipment cards are exposed only through a minimized security-definer RPC.
create table public.equipment_public_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  asset_id uuid not null,
  public_token uuid not null default gen_random_uuid(),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_id),
  unique (public_token),
  foreign key (organization_id, asset_id)
    references public.assets (organization_id, id) on delete cascade
);

alter table public.equipment_public_links enable row level security;

create policy equipment_public_links_select_member on public.equipment_public_links
for select to authenticated
using (private.is_organization_member(organization_id));

create policy equipment_public_links_insert_technician on public.equipment_public_links
for insert to authenticated
with check (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]));

create policy equipment_public_links_update_technician on public.equipment_public_links
for update to authenticated
using (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]));

create trigger equipment_public_links_set_updated_at before update on public.equipment_public_links
for each row execute function public.set_updated_at();

create or replace function public.manage_equipment_public_link(
  target_asset_id uuid,
  next_enabled boolean default null,
  rotate_token boolean default false
) returns table (public_token uuid, enabled boolean)
language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid;
begin
  select a.organization_id into target_organization_id
  from public.assets a
  where a.id = target_asset_id and a.deleted_at is null;

  if target_organization_id is null or not private.has_organization_role(
    target_organization_id, array['owner','admin','technician']::public.organization_role[]
  ) then
    raise exception 'Equipment unavailable' using errcode = '42501';
  end if;

  insert into public.equipment_public_links (organization_id, asset_id)
  values (target_organization_id, target_asset_id)
  on conflict (organization_id, asset_id) do nothing;

  update public.equipment_public_links link
  set enabled = coalesce(next_enabled, link.enabled),
      public_token = case when rotate_token then gen_random_uuid() else link.public_token end
  where link.organization_id = target_organization_id and link.asset_id = target_asset_id;

  return query
  select link.public_token, link.enabled
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
    where link.public_token::text = token and link.enabled
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

revoke all on table public.equipment_public_links from public, anon;
grant select, insert, update on table public.equipment_public_links to authenticated;
revoke all on function public.manage_equipment_public_link(uuid, boolean, boolean) from public, anon;
grant execute on function public.manage_equipment_public_link(uuid, boolean, boolean) to authenticated;
revoke all on function public.get_public_equipment(text) from public;
grant execute on function public.get_public_equipment(text) to anon, authenticated;

comment on table public.equipment_public_links is
  'Stable organization-owned public tokens. A future authorized transfer can repoint a row without changing public_token.';
