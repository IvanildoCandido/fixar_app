-- Run after 20260828120000_offline_maintenance_idempotency.sql.
-- Every write is rolled back.
begin;

do $test$
declare
  v_org uuid; v_user uuid; v_customer uuid; v_asset uuid; v_catalog uuid;
  v_local uuid := gen_random_uuid(); v_failed_local uuid := gen_random_uuid();
  v_first uuid; v_second uuid; v_failed boolean := false; v_denied boolean := false;
begin
  select om.organization_id, om.user_id into v_org, v_user
  from public.organization_members om
  where om.status = 'active' and om.user_id is not null and om.role in ('owner','admin','technician')
  order by case om.role when 'owner' then 1 when 'admin' then 2 else 3 end limit 1;
  select c.id, a.id into v_customer, v_asset from public.customers c
  join public.assets a on a.organization_id = c.organization_id and a.customer_id = c.id
  where c.organization_id = v_org and c.deleted_at is null and a.deleted_at is null limit 1;
  select id into v_catalog from public.catalog_items
  where organization_id = v_org and kind = 'service' and deleted_at is null limit 1;
  if v_org is null or v_user is null or v_customer is null or v_asset is null then
    raise exception 'missing fixture for offline maintenance test';
  end if;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;

  v_first := public.create_work_order_offline(jsonb_build_object(
    'organizationId', v_org, 'localId', v_local, 'customerId', v_customer, 'deviceId', v_asset,
    'assignedTo', v_user, 'total', 25, 'services', jsonb_build_array(jsonb_build_object(
      'id', v_catalog, 'name', 'Offline test', 'quantity', 1, 'price', 25)), 'parts', '[]'::jsonb,
    'checks', jsonb_build_array(jsonb_build_object('key','offline-check','label','Offline check','status','ok')),
    'measurements', jsonb_build_array(jsonb_build_object('key','offline-measure','label','Offline measure','value',10,'unit','C'))
  ));
  v_second := public.create_work_order_offline(jsonb_build_object(
    'organizationId', v_org, 'localId', v_local, 'customerId', v_customer, 'deviceId', v_asset, 'total', 999));

  if v_first is distinct from v_second then raise exception 'idempotency returned different ids'; end if;
  if (select count(*) from public.work_orders where organization_id = v_org and offline_local_id = v_local) <> 1 then raise exception 'duplicate order'; end if;
  if (select count(*) from public.work_order_items where work_order_id = v_first) <> 1 then raise exception 'missing item'; end if;
  if (select count(*) from public.work_order_technical_checks where work_order_id = v_first) <> 1 then raise exception 'missing check'; end if;
  if (select count(*) from public.work_order_measurements where work_order_id = v_first) <> 1 then raise exception 'missing measurement'; end if;

  begin
    perform public.create_work_order_offline(jsonb_build_object(
      'organizationId', v_org, 'localId', v_failed_local, 'customerId', v_customer, 'deviceId', v_asset,
      'measurements', jsonb_build_array(jsonb_build_object('key','bad','label','Bad','value','invalid','unit','C'))));
  exception when invalid_text_representation then v_failed := true;
  end;
  if not v_failed or exists(select 1 from public.work_orders where offline_local_id = v_failed_local) then
    raise exception 'atomic rollback failed';
  end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  begin
    perform public.create_work_order_offline(jsonb_build_object(
      'organizationId', v_org, 'localId', gen_random_uuid(), 'customerId', v_customer, 'deviceId', v_asset));
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'unauthorized caller accepted'; end if;
end
$test$;

rollback;
