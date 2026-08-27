create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function private.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function private.is_platform_admin() from public, anon, authenticated, service_role;
grant usage on schema public to authenticated;
grant select on public.platform_admins to authenticated;

create policy platform_admins_self_read
  on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

create table public.generated_qr_codes (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  payload text not null,
  generated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint generated_qr_codes_reference_length check (char_length(reference) = 7),
  constraint generated_qr_codes_reference_unique unique (reference)
);

alter table public.generated_qr_codes enable row level security;
grant select, insert on public.generated_qr_codes to authenticated;

create policy generated_qr_codes_admin_read
  on public.generated_qr_codes for select to authenticated
  using (private.is_platform_admin());

create policy generated_qr_codes_admin_insert
  on public.generated_qr_codes for insert to authenticated
  with check (private.is_platform_admin() and generated_by = auth.uid());

create or replace function public.platform_admin_metrics()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_platform_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from auth.users),
    'organizations', (select count(*) from public.organizations where deleted_at is null),
    'customers', (select count(*) from public.customers where deleted_at is null),
    'assets', (select count(*) from public.assets where deleted_at is null),
    'work_orders', (select count(*) from public.work_orders where deleted_at is null),
    'qr_codes', (select count(*) from public.generated_qr_codes),
    'storage_files', (select count(*) from storage.objects),
    'storage_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0)
  ) into result;

  return result;
end;
$$;

revoke all on function public.platform_admin_metrics() from public, anon;
grant execute on function public.platform_admin_metrics() to authenticated;
