begin;

create or replace function public.audit_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_office_id uuid;
begin
  select office_id into v_office_id
  from public.profiles
  where id = new.id;

  if tg_op = 'UPDATE' then
    select public.record_audit_log(
      v_actor_id,
      'user_role_updated',
      'profile',
      new.id::text,
      v_office_id,
      jsonb_build_object(
        'role', old.role,
        'office_id', old.office_id,
        'account_status', old.account_status
      ),
      jsonb_build_object(
        'role', new.role,
        'office_id', new.office_id,
        'account_status', new.account_status
      ),
      jsonb_build_object('trigger', 'audit_profile_changes')
    );
  end if;

  return new;
end;
$$;

create trigger profiles_audit_trigger
  after update of role, office_id, account_status on public.profiles
  for each row execute function public.audit_profile_changes();

create or replace function public.audit_shipment_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_office_id uuid;
begin
  select office_id into v_office_id
  from public.shipments
  where id = new.id;

  if tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      select public.record_audit_log(
        v_actor_id,
        'shipment_status_changed',
        'shipment',
        new.id::text,
        v_office_id,
        jsonb_build_object('status', old.status),
        jsonb_build_object('status', new.status),
        jsonb_build_object('trigger', 'audit_shipment_changes')
      );
    end if;

    if old.office_id is distinct from new.office_id then
      select public.record_audit_log(
        v_actor_id,
        'shipment_status_changed',
        'shipment',
        new.id::text,
        coalesce(new.office_id, old.office_id),
        jsonb_build_object('office_id', old.office_id),
        jsonb_build_object('office_id', new.office_id),
        jsonb_build_object('trigger', 'audit_shipment_changes')
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger shipments_audit_trigger
  after update of status, office_id on public.shipments
  for each row execute function public.audit_shipment_changes();

create or replace function public.audit_office_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if tg_op = 'UPDATE' then
    select public.record_audit_log(
      v_actor_id,
      'office_updated',
      'office',
      new.id::text,
      new.id,
      jsonb_build_object(
        'name', old.name,
        'code', old.code,
        'status', old.status
      ),
      jsonb_build_object(
        'name', new.name,
        'code', new.code,
        'status', new.status
      ),
      jsonb_build_object('trigger', 'audit_office_changes')
    );
  end if;

  return new;
end;
$$;

create trigger offices_audit_trigger
  after update of name, code, status on public.offices
  for each row execute function public.audit_office_changes();

revoke all on function public.audit_profile_changes() from public, anon, authenticated;
revoke all on function public.audit_shipment_changes() from public, anon, authenticated;
revoke all on function public.audit_office_changes() from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
