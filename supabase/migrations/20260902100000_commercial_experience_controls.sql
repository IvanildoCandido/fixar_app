-- Visible commercial layer: premium feature enforcement, history scope and Global Admin controls.

create or replace function private.assert_can_use_feature(p_organization_id uuid, p_feature text)
returns void language plpgsql security definer set search_path = '' as $$
declare entitlements jsonb; enabled boolean;
begin
  if not private.is_platform_admin() and not private.is_organization_member(p_organization_id) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_feature not in ('batch_orders','custom_branding','full_history') then raise exception 'Invalid commercial feature' using errcode='22023'; end if;
  entitlements := private.get_effective_organization_entitlements(p_organization_id);
  enabled := coalesce((entitlements->'features'->>p_feature)::boolean,false);
  if not enabled then raise exception using message='PLAN_FEATURE_REQUIRED',detail=jsonb_build_object('code','PLAN_FEATURE_REQUIRED','feature',p_feature,'plan_code',entitlements->>'plan_code')::text,errcode='P0001'; end if;
end; $$;
revoke all on function private.assert_can_use_feature(uuid,text) from public,anon,authenticated;

create or replace function private.can_access_work_order_history(p_organization_id uuid,p_created_at timestamptz)
returns boolean language sql stable security definer set search_path='' as $$
  select private.is_organization_member(p_organization_id) and (
    coalesce((private.get_effective_organization_entitlements(p_organization_id)->'features'->>'full_history')::boolean,false)
    or (private.get_effective_organization_entitlements(p_organization_id)->>'history_days') is null
    or p_created_at >= now() - make_interval(days => (private.get_effective_organization_entitlements(p_organization_id)->>'history_days')::integer)
  );
$$;
revoke all on function private.can_access_work_order_history(uuid,timestamptz) from public,anon,authenticated;

drop policy if exists work_orders_select_member on public.work_orders;
create policy work_orders_select_member on public.work_orders for select to authenticated using (private.can_access_work_order_history(organization_id,created_at));
drop policy if exists work_order_items_select_member on public.work_order_items;
create policy work_order_items_select_member on public.work_order_items for select to authenticated using (exists(select 1 from public.work_orders w where w.organization_id=work_order_items.organization_id and w.id=work_order_items.work_order_id and private.can_access_work_order_history(w.organization_id,w.created_at)));
drop policy if exists work_order_technical_checks_select_member on public.work_order_technical_checks;
create policy work_order_technical_checks_select_member on public.work_order_technical_checks for select to authenticated using (exists(select 1 from public.work_orders w where w.organization_id=work_order_technical_checks.organization_id and w.id=work_order_technical_checks.work_order_id and private.can_access_work_order_history(w.organization_id,w.created_at)));
drop policy if exists work_order_measurements_select_member on public.work_order_measurements;
create policy work_order_measurements_select_member on public.work_order_measurements for select to authenticated using (exists(select 1 from public.work_orders w where w.organization_id=work_order_measurements.organization_id and w.id=work_order_measurements.work_order_id and private.can_access_work_order_history(w.organization_id,w.created_at)));

create or replace function public.create_work_orders_batch(payload jsonb)
returns table(id uuid,asset_id uuid) language plpgsql security definer set search_path='' as $$
declare organization_id uuid:=(payload->>'organizationId')::uuid;customer_id uuid:=(payload->>'customerId')::uuid;assigned_to uuid:=nullif(payload->>'assignedTo','')::uuid;device jsonb;order_id uuid;item jsonb;subtotal numeric(14,2);
begin
  if not private.has_organization_role(organization_id,array['owner','admin','technician']::public.organization_role[]) then raise exception 'Not authorized for organization' using errcode='42501'; end if;
  perform private.assert_can_use_feature(organization_id,'batch_orders');
  for device in select value from jsonb_array_elements(coalesce(payload->'devices','[]'::jsonb)) loop
    subtotal:=coalesce((payload->>'subtotal')::numeric,0);
    insert into public.work_orders(organization_id,customer_id,asset_id,assigned_to,status,comments,subtotal,total,completed_at,reminder_enabled,reminder_interval_days,reminder_due_at)
    values(organization_id,customer_id,(device->>'id')::uuid,assigned_to,'completed',nullif(payload->>'comments',''),subtotal,coalesce((payload->>'total')::numeric,subtotal),coalesce((payload->>'date')::timestamptz,now()),coalesce((payload->>'reminderEnabled')::boolean,false),nullif(payload->>'reminderIntervalDays','')::integer,nullif(payload->>'reminderDueAt','')::timestamptz)
    returning work_orders.id into order_id;
    for item in select value from jsonb_array_elements(coalesce(payload->'items','[]'::jsonb)) loop
      insert into public.work_order_items(organization_id,work_order_id,catalog_item_id,kind,name,description,quantity,unit_price)
      values(organization_id,order_id,nullif(item->>'id','')::uuid,(item->>'kind')::public.catalog_item_kind,item->>'name',nullif(item->>'description',''),coalesce((item->>'quantity')::numeric,1),coalesce((item->>'price')::numeric,0));
    end loop;
    id:=order_id;asset_id:=(device->>'id')::uuid;return next;
  end loop;
end; $$;
revoke all on function public.create_work_orders_batch(jsonb) from public,anon;
grant execute on function public.create_work_orders_batch(jsonb) to authenticated;

create or replace function public.platform_admin_commercial_organizations()
returns setof jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,'created_at',o.created_at,
    'customers',(select count(*) from public.customers c where c.organization_id=o.id and c.deleted_at is null),'assets',(select count(*) from public.assets a where a.organization_id=o.id and a.deleted_at is null),'work_orders',(select count(*) from public.work_orders w where w.organization_id=o.id and w.deleted_at is null),'members',(select count(*) from public.organization_members m where m.organization_id=o.id and m.status='active'),'qr_codes',(private.get_organization_commercial_usage(o.id)->>'qr_codes')::bigint,
    'last_activity',(select max(w.created_at) from public.work_orders w where w.organization_id=o.id),
    'entitlements',private.get_effective_organization_entitlements(o.id),'usage',private.get_organization_commercial_usage(o.id))
  from public.organizations o where o.deleted_at is null and private.is_platform_admin() order by o.name;
$$;

create or replace function public.platform_admin_update_commercial(p_organization_id uuid,p_plan_code public.commercial_plan_code,p_status public.subscription_status,p_offer_code public.commercial_offer_code default null,p_override jsonb default null,p_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_offer_code='founder' and p_plan_code<>'professional' then raise exception 'Founder requires Professional' using errcode='22023'; end if;
  insert into public.organization_subscriptions(organization_id,plan_code,subscription_status,offer_code,metadata)
  values(p_organization_id,p_plan_code,p_status,p_offer_code,jsonb_build_object('reason',nullif(btrim(p_reason),'')))
  on conflict(organization_id) do update set plan_code=excluded.plan_code,subscription_status=excluded.subscription_status,offer_code=excluded.offer_code,metadata=excluded.metadata,updated_at=now();
  update public.organization_plan_overrides set active=false,updated_at=now() where organization_id=p_organization_id and active;
  if p_override is not null and p_override<>'{}'::jsonb then
    insert into public.organization_plan_overrides(organization_id,plan_code,offer_code,limit_users,limit_customers,limit_equipment,limit_qr_codes,limit_work_orders_monthly,limit_quotes_monthly,feature_batch_orders,feature_custom_branding,feature_full_history,history_days,notes)
    values(p_organization_id,p_plan_code,p_offer_code,nullif(p_override->>'users','')::int,nullif(p_override->>'customers','')::int,nullif(p_override->>'equipment','')::int,nullif(p_override->>'qr_codes','')::int,nullif(p_override->>'work_orders_monthly','')::int,nullif(p_override->>'quotes_monthly','')::int,nullif(p_override->>'batch_orders','')::boolean,nullif(p_override->>'custom_branding','')::boolean,nullif(p_override->>'full_history','')::boolean,nullif(p_override->>'history_days','')::int,nullif(btrim(p_reason),''));
  end if;
  result:=jsonb_build_object('entitlements',private.get_effective_organization_entitlements(p_organization_id),'usage',private.get_organization_commercial_usage(p_organization_id));return result;
end; $$;
revoke all on function public.platform_admin_commercial_organizations() from public,anon;
revoke all on function public.platform_admin_update_commercial(uuid,public.commercial_plan_code,public.subscription_status,public.commercial_offer_code,jsonb,text) from public,anon;
grant execute on function public.platform_admin_commercial_organizations() to authenticated;
grant execute on function public.platform_admin_update_commercial(uuid,public.commercial_plan_code,public.subscription_status,public.commercial_offer_code,jsonb,text) to authenticated;

create or replace function public.get_public_equipment(token text) returns jsonb language sql stable security definer set search_path='' as $$
with target as(select l.organization_id,l.asset_id from public.equipment_public_links l join public.assets a on a.organization_id=l.organization_id and a.id=l.asset_id join public.organizations o on o.id=l.organization_id where l.public_token::text=token and a.deleted_at is null and o.deleted_at is null), entitlement as(select private.get_effective_organization_entitlements(organization_id) e from target), history as(select w.id,w.completed_at,coalesce(jsonb_agg(i.name order by i.created_at) filter(where i.id is not null),'[]'::jsonb) services from target cross join entitlement join public.work_orders w on w.organization_id=target.organization_id and w.asset_id=target.asset_id and w.deleted_at is null and w.completed_at is not null and ((e->'features'->>'full_history')::boolean or (e->>'history_days') is null or w.created_at>=now()-make_interval(days=>(e->>'history_days')::int)) left join public.work_order_items i on i.organization_id=w.organization_id and i.work_order_id=w.id and i.kind='service' group by w.id,w.completed_at order by w.completed_at desc limit 10), next_maintenance as(select min(w.reminder_due_at) due_at from target join public.work_orders w on w.organization_id=target.organization_id and w.asset_id=target.asset_id and w.deleted_at is null and w.reminder_enabled and w.reminder_due_at is not null)
select jsonb_build_object('organization',jsonb_build_object('name',o.name,'logo_path',case when (e->'features'->>'custom_branding')::boolean then o.logo_path end,'phone',o.phone),'equipment',jsonb_build_object('reference',a.reference,'type',a.equipment_type,'brand',a.brand,'model',a.model,'capacity_btu',a.capacity_btu,'location',a.location),'last_maintenance',(select jsonb_build_object('date',h.completed_at,'services',h.services,'status','completed') from history h order by h.completed_at desc limit 1),'next_maintenance',(select jsonb_build_object('date',n.due_at) from next_maintenance n where n.due_at is not null),'history',coalesce((select jsonb_agg(jsonb_build_object('date',h.completed_at,'services',h.services,'status','completed') order by h.completed_at desc) from history h),'[]'::jsonb)) from target cross join entitlement join public.organizations o on o.id=target.organization_id join public.assets a on a.organization_id=target.organization_id and a.id=target.asset_id;
$$;
