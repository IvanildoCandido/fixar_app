-- Backward compatibility for clients that still send Storage uploads as upserts.
-- Access remains restricted to active owners/admins in the organization folder.
create policy organization_logos_select_admin on storage.objects for select to authenticated
using (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]));

alter policy organization_logos_update_admin on storage.objects
using (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]))
with check (bucket_id = 'organization-logos' and private.has_organization_role(
  ((storage.foldername(name))[1])::uuid, array['owner','admin']::public.organization_role[]));
