-- Optional organization branding used in customer-facing documents.
alter table public.organizations
  add column if not exists logo_path text;

comment on column public.organizations.logo_path is
  'Object path in the organization-logos bucket. Objects are namespaced by organization id.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('organization-logos', 'organization-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy organization_logos_insert_admin on storage.objects for insert to authenticated
with check (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]));

create policy organization_logos_update_admin on storage.objects for update to authenticated
using (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]));

create policy organization_logos_delete_admin on storage.objects for delete to authenticated
using (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]));
