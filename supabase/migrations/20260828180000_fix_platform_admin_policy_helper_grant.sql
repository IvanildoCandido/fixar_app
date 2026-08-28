-- RLS policies execute with the caller privileges and need access to this boolean helper.
grant execute on function private.is_platform_admin() to authenticated;
