-- Atomic and idempotent creation for individual maintenance completed from the device.

alter table public.work_orders
  add column offline_local_id uuid;

create unique index work_orders_org_offline_local_id_uidx
  on public.work_orders (organization_id, offline_local_id)
  where offline_local_id is not null;

create function public.create_work_order_offline(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid := (payload->>'organizationId')::uuid;
  v_local_id uuid := (payload->>'localId')::uuid;
  v_customer_id uuid := (payload->>'customerId')::uuid;
  v_asset_id uuid := (payload->>'deviceId')::uuid;
  v_assigned_to uuid := nullif(payload->>'assignedTo', '')::uuid;
  v_order_id uuid;
  item jsonb;
  technical_check jsonb;
  measurement jsonb;
  subtotal numeric(14,2) := 0;
begin
  if v_organization_id is null or v_local_id is null or v_customer_id is null or v_asset_id is null then
    raise exception 'Required maintenance identifiers are missing' using errcode = '22023';
  end if;

  if not private.has_organization_role(
    v_organization_id,
    array['owner','admin','technician']::public.organization_role[]
  ) then
    raise exception 'Not authorized for organization' using errcode = '42501';
  end if;

  select id into v_order_id from public.work_orders
  where work_orders.organization_id = v_organization_id and offline_local_id = v_local_id;
  if v_order_id is not null then return v_order_id; end if;

  if not exists (select 1 from public.customers where id = v_customer_id and organization_id = v_organization_id and deleted_at is null)
    or not exists (select 1 from public.assets where id = v_asset_id and customer_id = v_customer_id and organization_id = v_organization_id and deleted_at is null) then
    raise exception 'Customer or asset does not belong to organization' using errcode = '23503';
  end if;

  select coalesce(sum(coalesce((value->>'quantity')::numeric, 1) * coalesce((value->>'price')::numeric, 0)), 0)
    into subtotal
    from jsonb_array_elements(coalesce(payload->'services', '[]'::jsonb) || coalesce(payload->'parts', '[]'::jsonb));

  insert into public.work_orders (
    organization_id, customer_id, asset_id, assigned_to, offline_local_id, status, comments,
    subtotal, total, completed_at, reminder_enabled, reminder_interval_days, reminder_due_at,
    reported_problem, found_condition, technical_diagnosis, equipment_status, problem_resolved,
    return_required, return_reason, customer_recommendation, recommendation_priority,
    technician_name, customer_signer_name, technician_signature_svg, customer_signature_svg, signed_at
  ) values (
    v_organization_id, v_customer_id, v_asset_id, v_assigned_to, v_local_id, 'completed', nullif(payload->>'comments',''),
    subtotal, coalesce((payload->>'total')::numeric, subtotal), coalesce((payload->>'date')::timestamptz, now()),
    coalesce((payload->>'reminderEnabled')::boolean, false), nullif(payload->>'reminderIntervalDays','')::integer,
    nullif(payload->>'reminderDueAt','')::timestamptz, nullif(payload#>>'{diagnosis,reportedProblem}',''),
    nullif(payload#>>'{diagnosis,foundCondition}',''), nullif(payload#>>'{diagnosis,technicalDiagnosis}',''),
    nullif(payload#>>'{result,equipmentStatus}','')::public.equipment_operating_status,
    nullif(payload#>>'{result,problemResolved}','')::public.problem_resolution_status,
    nullif(payload#>>'{result,returnRequired}','')::boolean, nullif(payload#>>'{result,returnReason}',''),
    nullif(payload#>>'{result,customerRecommendation}',''), nullif(payload#>>'{result,recommendationPriority}','')::public.recommendation_priority,
    nullif(payload->>'technicianName',''), nullif(payload->>'customerSignerName',''),
    nullif(payload->>'technicianSignatureSvg',''), nullif(payload->>'customerSignatureSvg',''), nullif(payload->>'signedAt','')::timestamptz
  ) returning id into v_order_id;

  for item in select value || jsonb_build_object('_kind', 'service') from jsonb_array_elements(coalesce(payload->'services','[]'::jsonb))
    union all select value || jsonb_build_object('_kind', 'part') from jsonb_array_elements(coalesce(payload->'parts','[]'::jsonb))
  loop
    insert into public.work_order_items (organization_id, work_order_id, catalog_item_id, kind, name, description, quantity, unit_price)
    values (v_organization_id, v_order_id, nullif(item->>'id','')::uuid, (item->>'_kind')::public.catalog_item_kind,
      item->>'name', nullif(item->>'description',''), coalesce((item->>'quantity')::numeric,1), coalesce((item->>'price')::numeric,0));
  end loop;

  for technical_check in select value from jsonb_array_elements(coalesce(payload->'checks','[]'::jsonb)) loop
    insert into public.work_order_technical_checks (organization_id, work_order_id, key, label, category, status, observation, sort_order)
    values (v_organization_id, v_order_id, technical_check->>'key', technical_check->>'label', nullif(technical_check->>'category',''),
      (technical_check->>'status')::public.technical_check_status, nullif(technical_check->>'observation',''), coalesce((technical_check->>'order')::integer,0));
  end loop;

  for measurement in select value from jsonb_array_elements(coalesce(payload->'measurements','[]'::jsonb)) loop
    insert into public.work_order_measurements (organization_id, work_order_id, key, label, value, unit, source, sort_order)
    values (v_organization_id, v_order_id, measurement->>'key', measurement->>'label', (measurement->>'value')::numeric,
      measurement->>'unit', coalesce(measurement->>'source','manual'), coalesce((measurement->>'order')::integer,0));
  end loop;
  return v_order_id;
exception when unique_violation then
  select id into v_order_id from public.work_orders
  where work_orders.organization_id = v_organization_id and offline_local_id = v_local_id;
  if v_order_id is not null then return v_order_id; end if;
  raise;
end;
$$;

revoke all on function public.create_work_order_offline(jsonb) from public, anon;
grant execute on function public.create_work_order_offline(jsonb) to authenticated;
