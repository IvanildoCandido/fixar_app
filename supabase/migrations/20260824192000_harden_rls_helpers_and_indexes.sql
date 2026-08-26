-- Keep RLS helpers out of the API-exposed public schema while preserving
-- their policy dependencies, and cover all application foreign keys.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

alter function public.is_organization_member(uuid) set schema private;
alter function public.has_organization_role(uuid, public.organization_role[]) set schema private;

revoke all on function private.is_organization_member(uuid) from public, anon, authenticated;
revoke all on function private.has_organization_role(uuid, public.organization_role[]) from public, anon, authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, public.organization_role[]) to authenticated;

create index organization_members_invited_by_idx
  on public.organization_members (invited_by);
create index work_orders_assigned_to_idx
  on public.work_orders (assigned_to);
create index work_order_items_catalog_item_idx
  on public.work_order_items (organization_id, catalog_item_id);
create index quotes_customer_idx
  on public.quotes (organization_id, customer_id);
create index quotes_asset_idx
  on public.quotes (organization_id, asset_id);
create index quotes_work_order_idx
  on public.quotes (organization_id, work_order_id);
create index quote_items_catalog_item_idx
  on public.quote_items (organization_id, catalog_item_id);
create index attachments_customer_idx
  on public.attachments (organization_id, customer_id);
create index attachments_asset_idx
  on public.attachments (organization_id, asset_id);
create index attachments_quote_idx
  on public.attachments (organization_id, quote_id);
create index attachments_uploaded_by_idx
  on public.attachments (uploaded_by);
create index audit_events_actor_idx
  on public.audit_events (actor_id);
