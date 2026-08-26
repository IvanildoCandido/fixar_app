-- Fixar: initial multi-tenant SaaS schema.
-- Client writes are intentionally limited to organization owners/admins until
-- the detailed permission matrix is confirmed.

create extension if not exists pgcrypto with schema extensions;

create type public.organization_role as enum ('owner', 'admin', 'technician', 'viewer');
create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.catalog_item_kind as enum ('part', 'service');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  legal_name text,
  document text,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role public.organization_role not null default 'viewer',
  status public.membership_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_identity_check check (user_id is not null or invited_email is not null),
  unique (organization_id, user_id)
);

create unique index organization_members_pending_email_uidx
  on public.organization_members (organization_id, lower(invited_email))
  where invited_email is not null and user_id is null;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  email text,
  phone text,
  address text,
  document text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null,
  reference text not null check (btrim(reference) <> ''),
  model text,
  brand text,
  location text not null check (btrim(location) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, reference),
  foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  kind public.catalog_item_kind not null,
  name text not null check (btrim(name) <> ''),
  description text,
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id)
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null,
  asset_id uuid not null,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (btrim(status) <> ''),
  scheduled_at timestamptz,
  completed_at timestamptz,
  comments text,
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  surcharge numeric(14,2) not null default 0 check (surcharge >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id),
  foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict,
  foreign key (organization_id, asset_id)
    references public.assets (organization_id, id) on delete restrict
);

create table public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  work_order_id uuid not null,
  catalog_item_id uuid,
  kind public.catalog_item_kind not null,
  name text not null check (btrim(name) <> ''),
  description text,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, work_order_id)
    references public.work_orders (organization_id, id) on delete cascade,
  foreign key (organization_id, catalog_item_id)
    references public.catalog_items (organization_id, id) on delete set null (catalog_item_id)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null,
  asset_id uuid,
  work_order_id uuid,
  status text not null default 'draft' check (btrim(status) <> ''),
  valid_until date,
  notes text,
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  surcharge numeric(14,2) not null default 0 check (surcharge >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id),
  foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict,
  foreign key (organization_id, asset_id)
    references public.assets (organization_id, id) on delete restrict,
  foreign key (organization_id, work_order_id)
    references public.work_orders (organization_id, id) on delete set null (work_order_id)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  quote_id uuid not null,
  catalog_item_id uuid,
  kind public.catalog_item_kind not null,
  name text not null check (btrim(name) <> ''),
  description text,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, quote_id)
    references public.quotes (organization_id, id) on delete cascade,
  foreign key (organization_id, catalog_item_id)
    references public.catalog_items (organization_id, id) on delete set null
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid,
  asset_id uuid,
  work_order_id uuid,
  quote_id uuid,
  object_path text not null check (btrim(object_path) <> ''),
  file_name text not null check (btrim(file_name) <> ''),
  content_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, object_path),
  foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict,
  foreign key (organization_id, asset_id)
    references public.assets (organization_id, id) on delete restrict,
  foreign key (organization_id, work_order_id)
    references public.work_orders (organization_id, id) on delete cascade,
  foreign key (organization_id, quote_id)
    references public.quotes (organization_id, id) on delete cascade,
  constraint attachments_single_parent_check check (
    num_nonnulls(customer_id, asset_id, work_order_id, quote_id) = 1
  )
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members (user_id, status);
create index customers_org_active_idx on public.customers (organization_id) where deleted_at is null;
create index assets_org_customer_idx on public.assets (organization_id, customer_id) where deleted_at is null;
create index catalog_items_org_kind_idx on public.catalog_items (organization_id, kind) where deleted_at is null;
create index work_orders_org_status_idx on public.work_orders (organization_id, status) where deleted_at is null;
create index work_orders_org_customer_idx on public.work_orders (organization_id, customer_id);
create index work_orders_org_asset_idx on public.work_orders (organization_id, asset_id);
create index work_order_items_order_idx on public.work_order_items (organization_id, work_order_id);
create index quotes_org_status_idx on public.quotes (organization_id, status) where deleted_at is null;
create index quote_items_quote_idx on public.quote_items (organization_id, quote_id);
create index attachments_org_parent_idx on public.attachments (organization_id, work_order_id, quote_id);
create index audit_events_org_created_idx on public.audit_events (organization_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  );
$$;

create function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role = any(allowed_roles)
  );
$$;

create function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
strict
set search_path = ''
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.organization_role[]) from public;
revoke all on function public.safe_uuid(text) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function public.safe_uuid(text) to authenticated;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
create trigger assets_set_updated_at before update on public.assets
for each row execute function public.set_updated_at();
create trigger catalog_items_set_updated_at before update on public.catalog_items
for each row execute function public.set_updated_at();
create trigger work_orders_set_updated_at before update on public.work_orders
for each row execute function public.set_updated_at();
create trigger work_order_items_set_updated_at before update on public.work_order_items
for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes
for each row execute function public.set_updated_at();
create trigger quote_items_set_updated_at before update on public.quote_items
for each row execute function public.set_updated_at();
create trigger attachments_set_updated_at before update on public.attachments
for each row execute function public.set_updated_at();

create function public.reject_audit_event_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_events are immutable';
end;
$$;
revoke all on function public.reject_audit_event_change() from public;
create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function public.reject_audit_event_change();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.assets enable row level security;
alter table public.catalog_items enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_items enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.profiles, public.organizations, public.organization_members,
  public.customers, public.assets, public.catalog_items, public.work_orders,
  public.work_order_items, public.quotes, public.quote_items, public.attachments,
  public.audit_events from anon;
grant select, insert, update, delete on table public.profiles, public.organizations,
  public.organization_members, public.customers, public.assets, public.catalog_items,
  public.work_orders, public.work_order_items, public.quotes, public.quote_items,
  public.attachments to authenticated;
grant select on table public.audit_events to authenticated;

create policy profiles_select_self on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select_member on public.organizations for select to authenticated
using (public.is_organization_member(id));
create policy organizations_update_admin on public.organizations for update to authenticated
using (public.has_organization_role(id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(id, array['owner','admin']::public.organization_role[]));

create policy organization_members_select_member on public.organization_members for select to authenticated
using (public.is_organization_member(organization_id));
create policy organization_members_insert_admin on public.organization_members for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy organization_members_update_admin on public.organization_members for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy organization_members_delete_admin on public.organization_members for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy customers_select_member on public.customers for select to authenticated
using (public.is_organization_member(organization_id));
create policy customers_insert_admin on public.customers for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy customers_update_admin on public.customers for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy customers_delete_admin on public.customers for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy assets_select_member on public.assets for select to authenticated
using (public.is_organization_member(organization_id));
create policy assets_insert_admin on public.assets for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy assets_update_admin on public.assets for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy assets_delete_admin on public.assets for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy catalog_items_select_member on public.catalog_items for select to authenticated
using (public.is_organization_member(organization_id));
create policy catalog_items_insert_admin on public.catalog_items for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy catalog_items_update_admin on public.catalog_items for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy catalog_items_delete_admin on public.catalog_items for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy work_orders_select_member on public.work_orders for select to authenticated
using (public.is_organization_member(organization_id));
create policy work_orders_insert_admin on public.work_orders for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_orders_update_admin on public.work_orders for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_orders_delete_admin on public.work_orders for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy work_order_items_select_member on public.work_order_items for select to authenticated
using (public.is_organization_member(organization_id));
create policy work_order_items_insert_admin on public.work_order_items for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_items_update_admin on public.work_order_items for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_items_delete_admin on public.work_order_items for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy quotes_select_member on public.quotes for select to authenticated
using (public.is_organization_member(organization_id));
create policy quotes_insert_admin on public.quotes for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy quotes_update_admin on public.quotes for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy quotes_delete_admin on public.quotes for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy quote_items_select_member on public.quote_items for select to authenticated
using (public.is_organization_member(organization_id));
create policy quote_items_insert_admin on public.quote_items for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy quote_items_update_admin on public.quote_items for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy quote_items_delete_admin on public.quote_items for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy attachments_select_member on public.attachments for select to authenticated
using (public.is_organization_member(organization_id));
create policy attachments_insert_admin on public.attachments for insert to authenticated
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy attachments_update_admin on public.attachments for update to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy attachments_delete_admin on public.attachments for delete to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy audit_events_select_admin on public.audit_events for select to authenticated
using (public.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

insert into storage.buckets (id, name, public)
values ('fixar-attachments', 'fixar-attachments', false)
on conflict (id) do nothing;

create policy fixar_attachments_select_member on storage.objects for select to authenticated
using (
  bucket_id = 'fixar-attachments'
  and public.is_organization_member(public.safe_uuid((storage.foldername(name))[1]))
);
create policy fixar_attachments_insert_admin on storage.objects for insert to authenticated
with check (
  bucket_id = 'fixar-attachments'
  and public.has_organization_role(
    public.safe_uuid((storage.foldername(name))[1]),
    array['owner','admin']::public.organization_role[]
  )
);
create policy fixar_attachments_update_admin on storage.objects for update to authenticated
using (
  bucket_id = 'fixar-attachments'
  and public.has_organization_role(
    public.safe_uuid((storage.foldername(name))[1]),
    array['owner','admin']::public.organization_role[]
  )
)
with check (
  bucket_id = 'fixar-attachments'
  and public.has_organization_role(
    public.safe_uuid((storage.foldername(name))[1]),
    array['owner','admin']::public.organization_role[]
  )
);
create policy fixar_attachments_delete_admin on storage.objects for delete to authenticated
using (
  bucket_id = 'fixar-attachments'
  and public.has_organization_role(
    public.safe_uuid((storage.foldername(name))[1]),
    array['owner','admin']::public.organization_role[]
  )
);
