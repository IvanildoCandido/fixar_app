-- Management can rely on authenticated RLS; only the minimized public read needs elevated access.
alter function public.manage_equipment_public_link(uuid, boolean, boolean) security invoker;
