-- COM-3B: authoritative monthly quote creation enforcement.
-- Work orders and their online/offline flows are intentionally untouched.

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
  usage_key text := case p_resource when 'customer' then 'customers' when 'equipment' then 'equipment' when 'qr_code' then 'qr_codes' when 'quote' then 'quotes_monthly' end;
  limit_key text := case p_resource when 'customer' then 'customers' when 'equipment' then 'equipment' when 'qr_code' then 'qr_codes' when 'quote' then 'quotes_monthly' end;
begin
  if p_requested < 1 or p_resource not in ('customer', 'equipment', 'qr_code', 'quote') then
    raise exception 'Invalid commercial resource' using errcode = '22023';
  end if;
  if not private.is_platform_admin() and not private.is_organization_member(p_organization_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text, 0));
  entitlements := private.get_effective_organization_entitlements(p_organization_id);
  usage := private.get_organization_commercial_usage(p_organization_id);
  limit_value := (entitlements->'limits'->>limit_key)::integer;
  usage_value := (usage->>usage_key)::integer;
  if limit_value is not null and usage_value + p_requested > limit_value then
    raise exception using message = 'PLAN_LIMIT_REACHED', detail = jsonb_build_object(
      'code', 'PLAN_LIMIT_REACHED', 'resource', p_resource, 'usage', usage_value,
      'limit', limit_value, 'requested', p_requested,
      'plan_code', entitlements->>'plan_code'
    )::text, errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.create_quote(payload jsonb)
returns public.quotes
language plpgsql security definer set search_path = '' as $$
declare
  target_organization_id uuid := (payload->>'organizationId')::uuid;
  created_quote public.quotes;
  service_items jsonb := coalesce(payload->'services', '[]'::jsonb);
  part_items jsonb := coalesce(payload->'parts', '[]'::jsonb);
  calculated_subtotal numeric(14,2);
begin
  if not private.has_organization_role(target_organization_id, array['owner','admin']::public.organization_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform private.assert_can_create_resource(target_organization_id, 'quote', 1);
  select coalesce(sum(
    coalesce(nullif(item->>'qtd', '')::numeric, nullif(item->>'quantity', '')::numeric, 1)
    * coalesce(nullif(item->>'price', '')::numeric, 0)
  ), 0)::numeric(14,2)
  into calculated_subtotal
  from (
    select value as item from jsonb_array_elements(service_items)
    union all
    select value as item from jsonb_array_elements(part_items)
  ) items;
  insert into public.quotes (organization_id, customer_id, status, notes, subtotal, discount, surcharge, total)
  values (
    target_organization_id, (payload->>'customerId')::uuid, 'draft', nullif(payload->>'comments', ''),
    calculated_subtotal, coalesce(nullif(payload->>'discount', '')::numeric, 0),
    coalesce(nullif(payload->>'surcharge', '')::numeric, 0),
    coalesce(nullif(payload->>'total', '')::numeric, calculated_subtotal)
  ) returning * into created_quote;
  insert into public.quote_items (organization_id, quote_id, catalog_item_id, kind, name, description, quantity, unit_price)
  select target_organization_id, created_quote.id, nullif(item->>'id', '')::uuid, 'service', item->>'name', nullif(item->>'description', ''),
    coalesce(nullif(item->>'qtd', '')::numeric, nullif(item->>'quantity', '')::numeric, 1), coalesce(nullif(item->>'price', '')::numeric, 0)
  from jsonb_array_elements(service_items) item
  union all
  select target_organization_id, created_quote.id, nullif(item->>'id', '')::uuid, 'part', item->>'name', nullif(item->>'description', ''),
    coalesce(nullif(item->>'qtd', '')::numeric, nullif(item->>'quantity', '')::numeric, 1), coalesce(nullif(item->>'price', '')::numeric, 0)
  from jsonb_array_elements(part_items) item;
  return created_quote;
end;
$$;

create or replace function private.enforce_quote_restore()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.deleted_at is not null and new.deleted_at is null then
    perform private.assert_can_create_resource(new.organization_id, 'quote', 1);
  end if;
  return new;
end;
$$;

create trigger quotes_commercial_restore
before update on public.quotes
for each row execute function private.enforce_quote_restore();

create index quotes_commercial_created_idx on public.quotes (organization_id, created_at) where deleted_at is null;
revoke insert on table public.quotes from authenticated;
revoke all on function private.enforce_quote_restore() from public, anon, authenticated;
revoke all on function public.create_quote(jsonb) from public, anon;
grant execute on function public.create_quote(jsonb) to authenticated;
;
