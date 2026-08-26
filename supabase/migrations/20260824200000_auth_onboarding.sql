-- Auth profile provisioning and safe organization bootstrap.

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  ) values (
    new.id,
    current_user_id,
    'owner',
    'active',
    now()
  );

  return new;
end;
$$;

revoke all on function private.add_organization_owner() from public, anon, authenticated;

create trigger organizations_add_owner
after insert on public.organizations
for each row execute function private.add_organization_owner();

create policy organizations_insert_authenticated
on public.organizations
for insert
to authenticated
with check ((select auth.uid()) is not null);
