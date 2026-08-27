-- Fixar: harden the batch RPC, tenant-scoped user references and API grants.
-- Existing rows are never rewritten. The migration aborts if preexisting data
-- violates the invariants introduced below.

do $$
begin
  if to_regprocedure(
    'private.has_organization_role(uuid,public.organization_role[])'
  ) is null then
    raise exception 'required authorization helper private.has_organization_role is missing';
  end if;
end;
$$;

create or replace function public.create_work_orders_batch(payload jsonb)
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
  if not private.has_organization_role(
    organization_id,
    array['owner','admin','technician']::public.organization_role[]
  ) then
    raise exception 'Not authorized for organization' using errcode = '42501';
  end if;

  for device in
    select value
    from jsonb_array_elements(coalesce(payload->'devices', '[]'::jsonb))
  loop
    subtotal := coalesce((payload->>'subtotal')::numeric, 0);

    insert into public.work_orders (
      organization_id,
      customer_id,
      asset_id,
      assigned_to,
      status,
      comments,
      subtotal,
      total,
      completed_at,
      reminder_enabled,
      reminder_interval_days,
      reminder_due_at
    ) values (
      organization_id,
      customer_id,
      (device->>'id')::uuid,
      assigned_to,
      'completed',
      nullif(payload->>'comments',''),
      subtotal,
      coalesce((payload->>'total')::numeric, subtotal),
      coalesce((payload->>'date')::timestamptz, now()),
      coalesce((payload->>'reminderEnabled')::boolean, false),
      nullif(payload->>'reminderIntervalDays','')::integer,
      nullif(payload->>'reminderDueAt','')::timestamptz
    )
    returning work_orders.id into order_id;

    for item in
      select value
      from jsonb_array_elements(coalesce(payload->'items', '[]'::jsonb))
    loop
      insert into public.work_order_items (
        organization_id,
        work_order_id,
        catalog_item_id,
        kind,
        name,
        description,
        quantity,
        unit_price
      ) values (
        organization_id,
        order_id,
        nullif(item->>'id','')::uuid,
        (item->>'kind')::public.catalog_item_kind,
        item->>'name',
        nullif(item->>'description',''),
        coalesce((item->>'quantity')::numeric, 1),
        coalesce((item->>'price')::numeric, 0)
      );
    end loop;

    id := order_id;
    asset_id := (device->>'id')::uuid;
    return next;
  end loop;
end;
$$;

revoke all on function public.create_work_orders_batch(jsonb) from public, anon;
grant execute on function public.create_work_orders_batch(jsonb) to authenticated;

create or replace function private.enforce_organization_user_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  referenced_user_id uuid := nullif(to_jsonb(new)->>tg_argv[0], '')::uuid;
  require_active boolean := tg_argv[1]::boolean;
begin
  if referenced_user_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = new.organization_id
      and om.user_id = referenced_user_id
      and (not require_active or om.status = 'active')
  ) then
    raise exception 'referenced user is not eligible for this organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_organization_user_reference()
  from public, anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from public.work_orders w
    where w.assigned_to is not null
      and not exists (
        select 1
        from public.organization_members om
        where om.organization_id = w.organization_id
          and om.user_id = w.assigned_to
          and om.status = 'active'
      )
  ) then
    raise exception 'existing work_orders.assigned_to violates active organization membership';
  end if;

  if exists (
    select 1
    from public.attachments a
    where a.uploaded_by is not null
      and not exists (
        select 1
        from public.organization_members om
        where om.organization_id = a.organization_id
          and om.user_id = a.uploaded_by
          and om.status = 'active'
      )
  ) then
    raise exception 'existing attachments.uploaded_by violates active organization membership';
  end if;

  if exists (
    select 1
    from public.organization_members m
    where m.invited_by is not null
      and not exists (
        select 1
        from public.organization_members inviter
        where inviter.organization_id = m.organization_id
          and inviter.user_id = m.invited_by
      )
  ) then
    raise exception 'existing organization_members.invited_by violates organization membership';
  end if;

  if exists (
    select 1
    from public.audit_events e
    where e.actor_id is not null
      and not exists (
        select 1
        from public.organization_members om
        where om.organization_id = e.organization_id
          and om.user_id = e.actor_id
      )
  ) then
    raise exception 'existing audit_events.actor_id violates organization membership';
  end if;
end;
$$;

drop trigger if exists work_orders_validate_assigned_to on public.work_orders;
create trigger work_orders_validate_assigned_to
before insert or update of organization_id, assigned_to on public.work_orders
for each row execute function private.enforce_organization_user_reference('assigned_to', 'true');

drop trigger if exists attachments_validate_uploaded_by on public.attachments;
create trigger attachments_validate_uploaded_by
before insert or update of organization_id, uploaded_by on public.attachments
for each row execute function private.enforce_organization_user_reference('uploaded_by', 'true');

drop trigger if exists organization_members_validate_invited_by on public.organization_members;
create trigger organization_members_validate_invited_by
before insert or update of organization_id, invited_by on public.organization_members
for each row execute function private.enforce_organization_user_reference('invited_by', 'true');

drop trigger if exists audit_events_validate_actor_id on public.audit_events;
create trigger audit_events_validate_actor_id
before insert or update of organization_id, actor_id on public.audit_events
for each row execute function private.enforce_organization_user_reference('actor_id', 'false');

-- Event-trigger execution does not require API roles to call its backing
-- function directly. Keep SECURITY DEFINER so DDL by non-owners can still
-- enable RLS, while removing direct RPC exposure.
revoke all on function public.rls_auto_enable()
  from public, anon, authenticated, service_role;

revoke all on table
  public.technical_templates,
  public.work_order_technical_checks,
  public.work_order_measurements
from anon;

