-- Reconciliation follow-up: remove direct API execution that is unnecessary
-- for current trigger and Storage-policy helpers. No object or data is removed.

revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;

revoke all on function public.reject_audit_event_change()
  from public, anon, authenticated, service_role;

revoke all on function public.safe_uuid(text)
  from public, anon;
grant execute on function public.safe_uuid(text)
  to authenticated, service_role;

