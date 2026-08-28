alter table public.generated_qr_codes
  add column organization_id uuid references public.organizations(id) on delete set null;

create index generated_qr_codes_organization_created_idx
  on public.generated_qr_codes (organization_id, created_at desc);

grant delete on public.generated_qr_codes to authenticated;
create policy generated_qr_codes_admin_delete on public.generated_qr_codes
  for delete to authenticated using (private.is_platform_admin());

create or replace function public.platform_admin_organizations()
returns table (
  id uuid, name text, email text, phone text, created_at timestamptz,
  customers bigint, assets bigint, work_orders bigint, members bigint, qr_codes bigint
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query
  select organization.id, organization.name, organization.email, organization.phone, organization.created_at,
    (select count(*) from public.customers customer where customer.organization_id = organization.id and customer.deleted_at is null),
    (select count(*) from public.assets asset where asset.organization_id = organization.id and asset.deleted_at is null),
    (select count(*) from public.work_orders work_order where work_order.organization_id = organization.id and work_order.deleted_at is null),
    (select count(*) from public.organization_members member where member.organization_id = organization.id and member.status = 'active'),
    (select count(*) from public.generated_qr_codes qr where qr.organization_id = organization.id)
  from public.organizations organization
  where organization.deleted_at is null order by organization.name;
end;
$$;

create or replace function public.platform_admin_users()
returns table (
  id uuid, email text, display_name text, created_at timestamptz,
  last_sign_in_at timestamptz, organizations bigint
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query
  select auth_user.id, auth_user.email::text, profile.display_name, auth_user.created_at,
    auth_user.last_sign_in_at,
    (select count(*) from public.organization_members member where member.user_id = auth_user.id and member.status = 'active')
  from auth.users auth_user left join public.profiles profile on profile.id = auth_user.id
  order by auth_user.created_at desc;
end;
$$;

create or replace function public.platform_admin_qr_codes(target_organization_id uuid default null)
returns table (
  id uuid, reference text, payload text, organization_id uuid,
  organization_name text, created_at timestamptz
)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return query
  select qr.id, qr.reference, qr.payload, qr.organization_id, organization.name, qr.created_at
  from public.generated_qr_codes qr
  left join public.organizations organization on organization.id = qr.organization_id
  where target_organization_id is null or qr.organization_id = target_organization_id
  order by qr.created_at desc;
end;
$$;

revoke all on function public.platform_admin_organizations() from public, anon;
revoke all on function public.platform_admin_users() from public, anon;
revoke all on function public.platform_admin_qr_codes(uuid) from public, anon;
grant execute on function public.platform_admin_organizations() to authenticated;
grant execute on function public.platform_admin_users() to authenticated;
grant execute on function public.platform_admin_qr_codes(uuid) to authenticated;
