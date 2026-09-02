-- COM-3C hardening: authenticated clients only need row-level read/update/delete.
-- TRUNCATE bypasses RLS; REFERENCES and TRIGGER are not client capabilities.

revoke truncate, references, trigger on table public.work_orders from authenticated;
