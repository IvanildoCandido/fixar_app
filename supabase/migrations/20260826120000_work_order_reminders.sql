alter table public.work_orders
  add column reminder_interval_days integer,
  add column reminder_due_at timestamptz;

alter table public.work_orders
  add constraint work_orders_reminder_interval_days_check
    check (reminder_interval_days is null or reminder_interval_days > 0);

create index work_orders_assignee_reminder_due_idx
  on public.work_orders (assigned_to, reminder_due_at)
  where reminder_enabled = true
    and reminder_due_at is not null
    and deleted_at is null;

