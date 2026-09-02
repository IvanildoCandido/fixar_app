-- Fix enum casts in the atomic quote creation RPC.
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
  select target_organization_id, created_quote.id, nullif(item->>'id', '')::uuid, 'service'::public.catalog_item_kind, item->>'name', nullif(item->>'description', ''),
    coalesce(nullif(item->>'qtd', '')::numeric, nullif(item->>'quantity', '')::numeric, 1), coalesce(nullif(item->>'price', '')::numeric, 0)
  from jsonb_array_elements(service_items) item
  union all
  select target_organization_id, created_quote.id, nullif(item->>'id', '')::uuid, 'part'::public.catalog_item_kind, item->>'name', nullif(item->>'description', ''),
    coalesce(nullif(item->>'qtd', '')::numeric, nullif(item->>'quantity', '')::numeric, 1), coalesce(nullif(item->>'price', '')::numeric, 0)
  from jsonb_array_elements(part_items) item;
  return created_quote;
end;
$$;

revoke all on function public.create_quote(jsonb) from public, anon;
grant execute on function public.create_quote(jsonb) to authenticated;
