create index if not exists work_orders_org_completed_idx
  on public.work_orders (organization_id, completed_at desc, id desc)
  where deleted_at is null;

create index if not exists work_orders_org_customer_completed_idx
  on public.work_orders (organization_id, customer_id, completed_at desc)
  where deleted_at is null;

create index if not exists work_orders_org_asset_completed_idx
  on public.work_orders (organization_id, asset_id, completed_at desc)
  where deleted_at is null;

create index if not exists work_orders_org_assignee_reminder_idx
  on public.work_orders (organization_id, assigned_to, reminder_due_at, id)
  where deleted_at is null and reminder_enabled and reminder_due_at is not null;

create index if not exists catalog_items_org_kind_name_idx
  on public.catalog_items (organization_id, kind, name)
  where deleted_at is null;

create function public.create_work_orders_batch(payload jsonb)
returns table (id uuid, asset_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_id uuid := (payload->>'organizationId')::uuid;
  customer_id uuid := (payload->>'customerId')::uuid;
  assigned_to uuid := nullif(payload->>'assignedTo', '')::uuid;
  device jsonb;
  order_id uuid;
  item jsonb;
  subtotal numeric(14,2);
begin
  if not public.has_organization_role(organization_id, array['owner','admin','technician']::public.organization_role[]) then
    raise exception 'Not authorized for organization';
  end if;
  for device in select value from jsonb_array_elements(coalesce(payload->'devices', '[]'::jsonb)) loop
    subtotal := coalesce((payload->>'subtotal')::numeric, 0);
    insert into public.work_orders (organization_id, customer_id, asset_id, assigned_to, status, comments, subtotal, total, completed_at, reminder_enabled, reminder_interval_days, reminder_due_at)
    values (organization_id, customer_id, (device->>'id')::uuid, assigned_to, 'completed', nullif(payload->>'comments',''), subtotal, coalesce((payload->>'total')::numeric, subtotal), coalesce((payload->>'date')::timestamptz, now()), coalesce((payload->>'reminderEnabled')::boolean, false), nullif(payload->>'reminderIntervalDays','')::integer, nullif(payload->>'reminderDueAt','')::timestamptz)
    returning work_orders.id into order_id;
    for item in select value from jsonb_array_elements(coalesce(payload->'items', '[]'::jsonb)) loop
      insert into public.work_order_items (organization_id, work_order_id, catalog_item_id, kind, name, description, quantity, unit_price)
      values (organization_id, order_id, nullif(item->>'id','')::uuid, (item->>'kind')::public.catalog_item_kind, item->>'name', nullif(item->>'description',''), coalesce((item->>'quantity')::numeric,1), coalesce((item->>'price')::numeric,0));
    end loop;
    id := order_id; asset_id := (device->>'id')::uuid; return next;
  end loop;
end;
$$;

revoke all on function public.create_work_orders_batch(jsonb) from public;
grant execute on function public.create_work_orders_batch(jsonb) to authenticated;
