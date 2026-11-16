begin;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete restrict,
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id text not null check (btrim(entity_id) <> ''),
  office_id uuid references public.offices (id) on delete set null,
  previous_values jsonb,
  new_values jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_office_id_idx on public.audit_logs (office_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create or replace function public.can_read_audit_logs()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and account_status = 'active'
      and role in ('admin', 'office_manager')
  );
$$;

create policy "Admins and office managers can read audit logs"
  on public.audit_logs for select to authenticated
  using ((select public.can_read_audit_logs()));

create policy "No one can insert audit logs directly"
  on public.audit_logs for insert to authenticated
  using (false);

create policy "No one can update audit logs"
  on public.audit_logs for update to authenticated
  using (false)
  with check (false);

create policy "No one can delete audit logs"
  on public.audit_logs for delete to authenticated
  using (false);

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

revoke all on function public.can_read_audit_logs() from public, anon;
grant execute on function public.can_read_audit_logs() to authenticated;

create or replace function public.record_audit_log(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_office_id uuid,
  p_previous_values jsonb,
  p_new_values jsonb,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    office_id,
    previous_values,
    new_values,
    metadata,
    created_at
  )
  values (
    p_actor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_office_id,
    p_previous_values,
    p_new_values,
    p_metadata,
    now()
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.record_audit_log(
  uuid, text, text, text, uuid, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.record_audit_log(
  uuid, text, text, text, uuid, jsonb, jsonb, jsonb
) to authenticated;

notify pgrst, 'reload schema';

commit;
