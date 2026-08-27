-- Transactional regression test for 20260827180000_security_audit_hardening.sql.
-- Run against an isolated/local database or in a transaction-capable SQL runner.
-- Every fixture and DDL object created by this script is rolled back.

begin;

do $$
declare
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  admin_a uuid := gen_random_uuid();
  technician_a uuid := gen_random_uuid();
  admin_b uuid := gen_random_uuid();
  technician_b uuid := gen_random_uuid();
  customer_a uuid := gen_random_uuid();
  customer_b uuid := gen_random_uuid();
  asset_a_1 uuid := gen_random_uuid();
  asset_a_2 uuid := gen_random_uuid();
  asset_b uuid := gen_random_uuid();
  order_a uuid;
  created_count integer;
  before_orders integer;
  affected_rows integer;
begin
  insert into auth.users (id) values
    (admin_a), (technician_a), (admin_b), (technician_b);

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', admin_a::text, true);
  insert into public.organizations (id, name)
  values (org_a, 'Fixture Organization A');

  perform set_config('request.jwt.claim.sub', admin_b::text, true);
  insert into public.organizations (id, name)
  values (org_b, 'Fixture Organization B');
  execute 'reset role';

  update public.organization_members
  set role = 'admin'
  where (organization_id, user_id) in ((org_a, admin_a), (org_b, admin_b));

  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values
    (org_a, technician_a, 'technician', 'active', now()),
    (org_b, technician_b, 'technician', 'active', now());

  insert into public.customers (id, organization_id, name) values
    (customer_a, org_a, 'Fixture Customer A'),
    (customer_b, org_b, 'Fixture Customer B');

  insert into public.assets (
    id, organization_id, customer_id, reference, location
  ) values
    (asset_a_1, org_a, customer_a, 'fixture-a-1', 'Fixture'),
    (asset_a_2, org_a, customer_a, 'fixture-a-2', 'Fixture'),
    (asset_b, org_b, customer_b, 'fixture-b-1', 'Fixture');

  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', admin_a::text, true);

  if (select count(*) from public.customers where organization_id = org_b) <> 0 then
    raise exception 'organization A can read organization B';
  end if;

  update public.customers
  set name = 'Cross-tenant update must not happen'
  where id = customer_b;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'organization A can update organization B';
  end if;

  select count(*) into created_count
  from public.create_work_orders_batch(jsonb_build_object(
    'organizationId', org_a,
    'customerId', customer_a,
    'assignedTo', technician_a,
    'devices', jsonb_build_array(
      jsonb_build_object('id', asset_a_1),
      jsonb_build_object('id', asset_a_2)
    ),
    'items', jsonb_build_array(
      jsonb_build_object(
        'kind', 'service', 'name', 'Fixture Service',
        'quantity', 1, 'price', 10
      )
    ),
    'subtotal', 10,
    'total', 10
  ));

  if created_count <> 2 then
    raise exception 'expected two work orders from batch, got %', created_count;
  end if;

  if (select count(*) from public.work_orders where organization_id = org_a) <> 2
    or (select count(*) from public.work_order_items where organization_id = org_a) <> 2 then
    raise exception 'batch did not persist the expected orders and items';
  end if;

  begin
    perform public.create_work_orders_batch(jsonb_build_object(
      'organizationId', org_b,
      'customerId', customer_b,
      'assignedTo', technician_b,
      'devices', jsonb_build_array(jsonb_build_object('id', asset_b)),
      'items', '[]'::jsonb,
      'subtotal', 0,
      'total', 0
    ));
    raise exception 'cross-tenant batch was unexpectedly allowed';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.work_orders (
      organization_id, customer_id, asset_id, assigned_to
    ) values (org_a, customer_a, asset_a_1, technician_b);
    raise exception 'cross-tenant assigned_to was unexpectedly allowed';
  exception
    when check_violation then null;
  end;

  insert into public.work_orders (
    organization_id, customer_id, asset_id, assigned_to
  ) values (org_a, customer_a, asset_a_1, technician_a)
  returning id into order_a;

  insert into public.attachments (
    organization_id, work_order_id, object_path, file_name, uploaded_by
  ) values (org_a, order_a, org_a || '/fixture-ok', 'fixture.txt', technician_a);

  begin
    insert into public.attachments (
      organization_id, work_order_id, object_path, file_name, uploaded_by
    ) values (org_a, order_a, org_a || '/fixture-denied', 'fixture.txt', technician_b);
    raise exception 'cross-tenant uploaded_by was unexpectedly allowed';
  exception
    when check_violation then null;
  end;

  insert into public.organization_members (
    organization_id, invited_email, role, status, invited_by
  ) values (org_a, 'fixture-a@example.invalid', 'viewer', 'invited', admin_a);

  begin
    insert into public.organization_members (
      organization_id, invited_email, role, status, invited_by
    ) values (org_a, 'fixture-b@example.invalid', 'viewer', 'invited', admin_b);
    raise exception 'cross-tenant invited_by was unexpectedly allowed';
  exception
    when check_violation then null;
  end;

  execute 'reset role';

  insert into public.audit_events (
    organization_id, actor_id, action, entity_type
  ) values (org_a, technician_a, 'fixture', 'fixture');

  begin
    insert into public.audit_events (
      organization_id, actor_id, action, entity_type
    ) values (org_a, technician_b, 'fixture', 'fixture');
    raise exception 'cross-tenant actor_id was unexpectedly allowed';
  exception
    when check_violation then null;
  end;

  -- A failure on the second device must roll back everything produced by the
  -- function call (the caught exception creates a PL/pgSQL subtransaction).
  before_orders := (select count(*) from public.work_orders where organization_id = org_a);
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', admin_a::text, true);
  begin
    perform public.create_work_orders_batch(jsonb_build_object(
      'organizationId', org_a,
      'customerId', customer_a,
      'assignedTo', technician_a,
      'devices', jsonb_build_array(
        jsonb_build_object('id', asset_a_1),
        jsonb_build_object('id', asset_b)
      ),
      'items', '[]'::jsonb,
      'subtotal', 0,
      'total', 0
    ));
    raise exception 'partially invalid batch was unexpectedly allowed';
  exception
    when foreign_key_violation then null;
  end;

  if (select count(*) from public.work_orders where organization_id = org_a) <> before_orders then
    raise exception 'failed batch left a partial work order behind';
  end if;

  execute 'reset role';

  -- Membership lifecycle changes must not rewrite or invalidate history.
  update public.organization_members
  set status = 'suspended'
  where organization_id = org_a and user_id = technician_a;

  update public.work_orders
  set comments = 'Historical assignment remains valid'
  where id = order_a;

  delete from public.organization_members
  where organization_id = org_a and user_id = technician_a;

  if not exists (
    select 1 from public.work_orders
    where id = order_a and assigned_to = technician_a
  ) or not exists (
    select 1 from public.attachments
    where organization_id = org_a and uploaded_by = technician_a
  ) or not exists (
    select 1 from public.audit_events
    where organization_id = org_a and actor_id = technician_a
  ) then
    raise exception 'membership removal destroyed historical user references';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege('anon', 'public.create_work_orders_batch(jsonb)', 'EXECUTE') then
    raise exception 'anon can execute create_work_orders_batch';
  end if;

  if has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')
    or has_function_privilege('public', 'public.rls_auto_enable()', 'EXECUTE') then
    raise exception 'API role can execute rls_auto_enable';
  end if;

  if has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE')
    or has_function_privilege('anon', 'public.reject_audit_event_change()', 'EXECUTE')
    or has_function_privilege('anon', 'public.safe_uuid(text)', 'EXECUTE') then
    raise exception 'anon can execute an internal helper';
  end if;

  if not has_function_privilege('authenticated', 'public.safe_uuid(text)', 'EXECUTE') then
    raise exception 'authenticated lost the Storage policy helper';
  end if;

  if has_table_privilege('anon', 'public.technical_templates', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('anon', 'public.work_order_technical_checks', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('anon', 'public.work_order_measurements', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'anon retains privileges on technical tables';
  end if;
end;
$$;

create table public.security_rls_fixture (id bigint primary key);

do $$
begin
  if not (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'security_rls_fixture'
  ) then
    raise exception 'ensure_rls did not enable RLS on a new public table';
  end if;
end;
$$;

rollback;
