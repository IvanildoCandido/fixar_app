-- Account deletion requests are server-owned; shared organization data is never
-- deleted as a side effect of a member leaving.
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','completed','rejected')),
  reason text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists account_deletion_requests_pending_uidx
  on public.account_deletion_requests(user_id) where status = 'pending';
alter table public.account_deletion_requests enable row level security;
revoke all on table public.account_deletion_requests from public, anon, authenticated;
