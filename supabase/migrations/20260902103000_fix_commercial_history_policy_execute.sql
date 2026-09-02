-- RLS expressions execute as the caller and require access to their protected predicate.
grant execute on function private.can_access_work_order_history(uuid,timestamptz) to authenticated;
