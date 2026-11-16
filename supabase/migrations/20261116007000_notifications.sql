begin;

create type public.notification_type as enum (
  'shipment_registered',
  'shipment_received',
  'shipment_dispatched',
  'shipment_delivered',
  'transfer_created',
  'transfer_completed',
  'transfer_rejected',
  'problem_reported',
  'problem_assigned',
  'problem_resolved',
  'office_operation',
  'warehouse_operation',
  'system_alert'
);

create type public.notification_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (btrim(title) <> ''),
  message text not null check (btrim(message) <> ''),
  entity_type text,
  entity_id text,
  office_id uuid references public.offices (id) on delete set null,
  priority public.notification_priority not null default 'normal',
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email_enabled boolean not null default false,
  push_enabled boolean not null default true,
  shipment_notifications boolean not null default true,
  transfer_notifications boolean not null default true,
  problem_notifications boolean not null default true,
  system_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_is_read_idx on public.notifications (user_id, is_read);
create index notifications_created_at_idx on public.notifications (created_at desc);
create index notifications_office_id_idx on public.notifications (office_id);
create index notification_preferences_user_id_idx on public.notification_preferences (user_id);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

create policy "Users can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their own notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and is_read = true);

create policy "No one can insert notifications directly"
  on public.notifications for insert to authenticated
  using (false);

create policy "No one can delete notifications"
  on public.notifications for delete to authenticated
  using (false);

create policy "Users can read their own notification preferences"
  on public.notification_preferences for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their own notification preferences"
  on public.notification_preferences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "No one can insert notification preferences directly"
  on public.notification_preferences for insert to authenticated
  using (false);

create policy "No one can delete notification preferences"
  on public.notification_preferences for delete to authenticated
  using (false);

revoke all on public.notifications from anon, authenticated;
revoke all on public.notification_preferences from anon, authenticated;
grant select, update (is_read, read_at) on public.notifications to authenticated;
grant select, update on public.notification_preferences to authenticated;

create or replace function public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id text,
  p_office_id uuid,
  p_priority public.notification_priority
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  pref_enabled boolean;
begin
  select coalesce(
    (select push_enabled from public.notification_preferences where user_id = p_user_id),
    true
  ) into pref_enabled;

  if not pref_enabled then
    return null;
  end if;

  insert into public.notifications (
    user_id, type, title, message, entity_type, entity_id, office_id, priority
  )
  values (
    p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_office_id, p_priority
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_notification(uuid, public.notification_type, text, text, text, text, uuid, public.notification_priority) from public, anon, authenticated;
grant execute on function public.create_notification(uuid, public.notification_type, text, text, text, text, uuid, public.notification_priority) to authenticated;

notify pgrst, 'reload schema';

commit;
