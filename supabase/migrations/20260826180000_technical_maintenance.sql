-- Structured, extensible technical maintenance data.

create type public.technical_check_status as enum (
  'ok', 'attention', 'non_conforming', 'not_checked', 'not_applicable'
);
create type public.equipment_operating_status as enum (
  'operational', 'operational_with_notes', 'requires_repair', 'out_of_service'
);
create type public.problem_resolution_status as enum ('yes', 'partial', 'no');
create type public.recommendation_priority as enum ('low', 'normal', 'high', 'urgent');

alter table public.assets
  add column equipment_type text,
  add column serial_number text,
  add column capacity_btu integer check (capacity_btu is null or capacity_btu > 0),
  add column voltage integer check (voltage is null or voltage > 0),
  add column phase text check (phase is null or phase in ('single', 'two', 'three', 'other')),
  add column refrigerant text,
  add column installed_at date;

alter table public.work_orders
  add column reported_problem text,
  add column found_condition text,
  add column technical_diagnosis text,
  add column equipment_status public.equipment_operating_status,
  add column problem_resolved public.problem_resolution_status,
  add column return_required boolean,
  add column return_reason text,
  add column customer_recommendation text,
  add column recommendation_priority public.recommendation_priority,
  add column technician_name text,
  add column customer_signer_name text,
  add column technician_signature_svg text,
  add column customer_signature_svg text,
  add column signed_at timestamptz;

create table public.technical_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null check (btrim(key) <> ''),
  name text not null check (btrim(name) <> ''),
  equipment_type text,
  maintenance_type text,
  check_definitions jsonb not null default '[]'::jsonb check (jsonb_typeof(check_definitions) = 'array'),
  measurement_definitions jsonb not null default '[]'::jsonb check (jsonb_typeof(measurement_definitions) = 'array'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.work_order_technical_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  work_order_id uuid not null,
  key text not null check (btrim(key) <> ''),
  label text not null check (btrim(label) <> ''),
  category text,
  status public.technical_check_status not null default 'not_checked',
  observation text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, work_order_id, key),
  foreign key (organization_id, work_order_id)
    references public.work_orders (organization_id, id) on delete cascade
);

create table public.work_order_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  work_order_id uuid not null,
  key text not null check (btrim(key) <> ''),
  label text not null check (btrim(label) <> ''),
  value numeric not null,
  unit text not null check (btrim(unit) <> ''),
  source text not null default 'manual' check (source in ('manual', 'calculated')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, work_order_id, key),
  foreign key (organization_id, work_order_id)
    references public.work_orders (organization_id, id) on delete cascade
);

create index technical_templates_org_active_idx on public.technical_templates (organization_id, active);
create index work_order_checks_order_idx on public.work_order_technical_checks (organization_id, work_order_id, sort_order);
create index work_order_measurements_order_idx on public.work_order_measurements (organization_id, work_order_id, sort_order);

create trigger technical_templates_set_updated_at before update on public.technical_templates
for each row execute function public.set_updated_at();
create trigger work_order_checks_set_updated_at before update on public.work_order_technical_checks
for each row execute function public.set_updated_at();
create trigger work_order_measurements_set_updated_at before update on public.work_order_measurements
for each row execute function public.set_updated_at();

alter table public.technical_templates enable row level security;
alter table public.work_order_technical_checks enable row level security;
alter table public.work_order_measurements enable row level security;

create policy technical_templates_select_member on public.technical_templates for select to authenticated
using (private.is_organization_member(organization_id));
create policy technical_templates_insert_admin on public.technical_templates for insert to authenticated
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy technical_templates_update_admin on public.technical_templates for update to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy technical_templates_delete_admin on public.technical_templates for delete to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy work_order_checks_select_member on public.work_order_technical_checks for select to authenticated
using (private.is_organization_member(organization_id));
create policy work_order_checks_insert_admin on public.work_order_technical_checks for insert to authenticated
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_checks_update_admin on public.work_order_technical_checks for update to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_checks_delete_admin on public.work_order_technical_checks for delete to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

create policy work_order_measurements_select_member on public.work_order_measurements for select to authenticated
using (private.is_organization_member(organization_id));
create policy work_order_measurements_insert_admin on public.work_order_measurements for insert to authenticated
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_measurements_update_admin on public.work_order_measurements for update to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy work_order_measurements_delete_admin on public.work_order_measurements for delete to authenticated
using (private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
