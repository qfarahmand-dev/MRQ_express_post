begin;

create or replace function public.warehouse_receive_shipment(
  p_shipment_id uuid,
  p_warehouse_id uuid,
  p_location text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_office_id uuid;
  v_shipment_status public.shipment_status;
  v_warehouse_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role <> 'admin' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    select office_id, status
      into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;

    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if v_warehouse_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Warehouse does not belong to your office';
    end if;
  else
    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if not found then
      raise no_data_found using message = 'Warehouse not found';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  end if;

  if v_shipment_status <> 'registered' and v_shipment_status <> 'in_transit' then
    raise check_violation using message = 'Shipment must be registered or in transit to be received';
  end if;

  insert into public.warehouse_operations (
    shipment_id, warehouse_id, office_id, operation_type,
    previous_status, new_status, location, notes, created_by
  )
  values (
    p_shipment_id, p_warehouse_id,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    'receive',
    v_shipment_status, 'in_warehouse',
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  update public.shipments
  set status = 'in_warehouse', updated_at = now()
  where id = p_shipment_id;

  insert into public.shipment_events (shipment_id, status, location, note, created_by)
  values (
    p_shipment_id, 'in_warehouse',
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    v_actor_id
  );

  select public.record_audit_log(
    v_actor_id,
    'shipment_received',
    'shipment',
    p_shipment_id::text,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    jsonb_build_object('status', v_shipment_status),
    jsonb_build_object('status', 'in_warehouse', 'warehouse_id', p_warehouse_id, 'location', p_location),
    jsonb_build_object('warehouse_id', p_warehouse_id, 'location', p_location)
  );

  return v_new_id;
end;
$$;

create or replace function public.warehouse_dispatch_shipment(
  p_shipment_id uuid,
  p_warehouse_id uuid,
  p_location text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_office_id uuid;
  v_shipment_status public.shipment_status;
  v_warehouse_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role <> 'admin' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    select office_id, status
      into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;

    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if v_warehouse_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Warehouse does not belong to your office';
    end if;
  else
    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if not found then
      raise no_data_found using message = 'Warehouse not found';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  end if;

  if v_shipment_status <> 'in_warehouse' then
    raise check_violation using message = 'Shipment must be in warehouse to be dispatched';
  end if;

  insert into public.warehouse_operations (
    shipment_id, warehouse_id, office_id, operation_type,
    previous_status, new_status, location, notes, created_by
  )
  values (
    p_shipment_id, p_warehouse_id,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    'dispatch',
    v_shipment_status, 'dispatched',
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  update public.shipments
  set status = 'dispatched', updated_at = now()
  where id = p_shipment_id;

  insert into public.shipment_events (shipment_id, status, location, note, created_by)
  values (
    p_shipment_id, 'dispatched',
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    v_actor_id
  );

  select public.record_audit_log(
    v_actor_id,
    'shipment_status_changed',
    'shipment',
    p_shipment_id::text,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    jsonb_build_object('status', v_shipment_status),
    jsonb_build_object('status', 'dispatched', 'warehouse_id', p_warehouse_id, 'location', p_location),
    jsonb_build_object('warehouse_id', p_warehouse_id, 'location', p_location)
  );

  return v_new_id;
end;
$$;

create or replace function public.warehouse_record_storage_location(
  p_shipment_id uuid,
  p_warehouse_id uuid,
  p_location text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_office_id uuid;
  v_warehouse_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role <> 'admin' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    select office_id
      into v_shipment_office_id
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;

    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if v_warehouse_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Warehouse does not belong to your office';
    end if;
  else
    select office_id into v_warehouse_office_id
    from public.warehouses
    where id = p_warehouse_id;

    if not found then
      raise no_data_found using message = 'Warehouse not found';
    end if;

    select office_id into v_shipment_office_id
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  end if;

  insert into public.warehouse_operations (
    shipment_id, warehouse_id, office_id, operation_type,
    previous_status, new_status, location, notes, created_by
  )
  values (
    p_shipment_id, p_warehouse_id,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    'storage_record',
    null, null,
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  select public.record_audit_log(
    v_actor_id,
    'shipment_stored',
    'shipment',
    p_shipment_id::text,
    coalesce(v_actor_office_id, v_warehouse_office_id),
    null,
    jsonb_build_object('warehouse_id', p_warehouse_id, 'location', p_location),
    jsonb_build_object('warehouse_id', p_warehouse_id, 'location', p_location)
  );

  return v_new_id;
end;
$$;

create or replace function public.office_register_incoming(
  p_shipment_id uuid,
  p_office_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_status public.shipment_status;
  v_shipment_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  elsif v_actor_role = 'office_manager' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    if p_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot register shipment for another office';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;
  else
    raise insufficient_privilege using message = 'Only office managers and admins can register incoming shipments';
  end if;

  insert into public.office_operations (
    shipment_id, source_office_id, destination_office_id, office_id,
    operation_type, previous_status, new_status, notes, created_by
  )
  values (
    p_shipment_id, v_shipment_office_id, p_office_id, p_office_id,
    'incoming', v_shipment_status, 'registered',
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  update public.shipments
  set office_id = p_office_id, status = 'registered', updated_at = now()
  where id = p_shipment_id;

  insert into public.shipment_events (shipment_id, status, note, created_by)
  values (
    p_shipment_id, 'registered',
    nullif(btrim(p_note), ''),
    v_actor_id
  );

  select public.record_audit_log(
    v_actor_id,
    'shipment_status_changed',
    'shipment',
    p_shipment_id::text,
    p_office_id,
    jsonb_build_object('status', v_shipment_status, 'office_id', v_shipment_office_id),
    jsonb_build_object('status', 'registered', 'office_id', p_office_id),
    jsonb_build_object('office_id', p_office_id)
  );

  return v_new_id;
end;
$$;

create or replace function public.office_register_outgoing(
  p_shipment_id uuid,
  p_office_id uuid,
  p_destination_office_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_status public.shipment_status;
  v_shipment_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  elsif v_actor_role = 'office_manager' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    if p_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot register shipment from another office';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;
  else
    raise insufficient_privilege using message = 'Only office managers and admins can register outgoing shipments';
  end if;

  insert into public.office_operations (
    shipment_id, source_office_id, destination_office_id, office_id,
    operation_type, previous_status, new_status, notes, created_by
  )
  values (
    p_shipment_id, v_shipment_office_id, p_destination_office_id, p_office_id,
    'outgoing', v_shipment_status, 'registered',
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  update public.shipments
  set office_id = p_office_id, status = 'registered', updated_at = now()
  where id = p_shipment_id;

  insert into public.shipment_events (shipment_id, status, note, created_by)
  values (
    p_shipment_id, 'registered',
    nullif(btrim(p_note), ''),
    v_actor_id
  );

  select public.record_audit_log(
    v_actor_id,
    'shipment_status_changed',
    'shipment',
    p_shipment_id::text,
    p_office_id,
    jsonb_build_object('status', v_shipment_status, 'office_id', v_shipment_office_id),
    jsonb_build_object('status', 'registered', 'office_id', p_office_id, 'destination_office_id', p_destination_office_id),
    jsonb_build_object('office_id', p_office_id, 'destination_office_id', p_destination_office_id)
  );

  return v_new_id;
end;
$$;

create or replace function public.office_transfer_shipment(
  p_shipment_id uuid,
  p_source_office_id uuid,
  p_destination_office_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_status public.shipment_status;
  v_shipment_office_id uuid;
  v_transfer_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  elsif v_actor_role = 'office_manager' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    if p_source_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot transfer shipment from another office';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;
  else
    raise insufficient_privilege using message = 'Only office managers and admins can transfer shipments';
  end if;

  if not exists (
    select 1 from public.offices where id = p_destination_office_id and status = 'active'
  ) then
    raise no_data_found using message = 'Destination office not found or inactive';
  end if;

  insert into public.shipment_transfers (
    shipment_id, source_office_id, destination_office_id, office_id,
    state, note, created_by
  )
  values (
    p_shipment_id, p_source_office_id, p_destination_office_id,
    p_source_office_id, 'in_transit', nullif(btrim(p_note), ''), v_actor_id
  )
  returning id into v_transfer_id;

  insert into public.office_operations (
    shipment_id, source_office_id, destination_office_id, office_id,
    operation_type, previous_status, new_status, notes, created_by
  )
  values (
    p_shipment_id, p_source_office_id, p_destination_office_id, p_source_office_id,
    'transfer', v_shipment_status, v_shipment_status,
    nullif(btrim(p_note), ''),
    v_actor_id
  );

  select public.record_audit_log(
    v_actor_id,
    'warehouse_transfer_registered',
    'shipment',
    p_shipment_id::text,
    p_source_office_id,
    jsonb_build_object('status', v_shipment_status, 'office_id', p_source_office_id),
    jsonb_build_object('status', v_shipment_status, 'source_office_id', p_source_office_id, 'destination_office_id', p_destination_office_id),
    jsonb_build_object('source_office_id', p_source_office_id, 'destination_office_id', p_destination_office_id)
  );

  return v_transfer_id;
end;
$$;

create or replace function public.office_record_handover(
  p_shipment_id uuid,
  p_source_office_id uuid,
  p_destination_office_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_shipment_office_id uuid;
  v_shipment_status public.shipment_status;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;
  elsif v_actor_role = 'office_manager' then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    if p_source_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot handover shipment from another office';
    end if;

    select office_id, status into v_shipment_office_id, v_shipment_status
    from public.shipments
    where id = p_shipment_id
      for update;

    if not found then
      raise no_data_found using message = 'Shipment not found';
    end if;

    if v_shipment_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Shipment does not belong to your office';
    end if;
  else
    raise insufficient_privilege using message = 'Only office managers and admins can record handovers';
  end if;

  update public.shipment_transfers
  set state = 'received', received_by = v_actor_id, received_at = now()
  where shipment_id = p_shipment_id
    and source_office_id = p_source_office_id
    and destination_office_id = p_destination_office_id
    and state = 'in_transit';

  insert into public.office_operations (
    shipment_id, source_office_id, destination_office_id, office_id,
    operation_type, previous_status, new_status, notes, created_by
  )
  values (
    p_shipment_id, p_source_office_id, p_destination_office_id, p_destination_office_id,
    'handover', v_shipment_status, v_shipment_status,
    nullif(btrim(p_note), ''),
    v_actor_id
  )
  returning id into v_new_id;

  select public.record_audit_log(
    v_actor_id,
    'shipment_status_changed',
    'shipment',
    p_shipment_id::text,
    p_destination_office_id,
    jsonb_build_object('status', v_shipment_status, 'office_id', p_source_office_id),
    jsonb_build_object('status', v_shipment_status, 'office_id', p_destination_office_id),
    jsonb_build_object('source_office_id', p_source_office_id, 'destination_office_id', p_destination_office_id)
  );

  return v_new_id;
end;
$$;

create or replace function public.report_shipment_issue(
  p_shipment_id uuid,
  p_office_id uuid,
  p_kind public.issue_kind,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    null;
  elsif v_actor_role in ('office_manager', 'storekeeper') then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    if p_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot report issue for another office';
    end if;
  else
    raise insufficient_privilege using message = 'Unauthorized role';
  end if;

  insert into public.shipment_issues (
    shipment_id, office_id, kind, description, state, created_by
  )
  values (
    p_shipment_id, p_office_id, p_kind, p_description, 'open', v_actor_id
  )
  returning id into v_new_id;

  select public.record_audit_log(
    v_actor_id,
    'issue_reported',
    'shipment_issue',
    v_new_id::text,
    p_office_id,
    null,
    jsonb_build_object('shipment_id', p_shipment_id, 'kind', p_kind, 'description', p_description),
    jsonb_build_object('shipment_id', p_shipment_id, 'kind', p_kind)
  );

  return v_new_id;
end;
$$;

create or replace function public.resolve_shipment_issue(
  p_issue_id uuid,
  p_office_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.app_role;
  v_actor_office_id uuid;
  v_issue_office_id uuid;
  v_issue_state public.issue_state;
  v_new_id uuid;
begin
  select role, office_id
    into v_actor_role, v_actor_office_id
    from public.profiles
    where id = v_actor_id
      and account_status = 'active';

  if not found then
    raise insufficient_privilege using message = 'An active profile is required';
  end if;

  if v_actor_role = 'admin' then
    null;
  elsif v_actor_role in ('office_manager', 'storekeeper') then
    if v_actor_office_id is null then
      raise insufficient_privilege using message = 'An office assignment is required';
    end if;

    select office_id, state into v_issue_office_id, v_issue_state
    from public.shipment_issues
    where id = p_issue_id
      for update;

    if not found then
      raise no_data_found using message = 'Issue not found';
    end if;

    if v_issue_office_id <> v_actor_office_id then
      raise insufficient_privilege using message = 'Cannot resolve issue for another office';
    end if;

    if v_issue_state <> 'open' then
      raise check_violation using message = 'Issue is already resolved';
    end if;
  else
    raise insufficient_privilege using message = 'Unauthorized role';
  end if;

  update public.shipment_issues
  set state = 'resolved', resolved_by = v_actor_id, resolved_at = now()
  where id = p_issue_id
    and state = 'open';

  select public.record_audit_log(
    v_actor_id,
    'shipment_status_changed',
    'shipment_issue',
    p_issue_id::text,
    p_office_id,
    jsonb_build_object('state', 'open'),
    jsonb_build_object('state', 'resolved', 'resolved_by', v_actor_id),
    jsonb_build_object('resolved_by', v_actor_id)
  );

  return p_issue_id;
end;
$$;

revoke all on function public.warehouse_receive_shipment(uuid, uuid, text, text) from public, anon;
revoke all on function public.warehouse_dispatch_shipment(uuid, uuid, text, text) from public, anon;
revoke all on function public.warehouse_record_storage_location(uuid, uuid, text, text) from public, anon;
revoke all on function public.office_register_incoming(uuid, uuid, text) from public, anon;
revoke all on function public.office_register_outgoing(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.office_transfer_shipment(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.office_record_handover(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.report_shipment_issue(uuid, uuid, public.issue_kind, text) from public, anon;
revoke all on function public.resolve_shipment_issue(uuid, uuid) from public, anon;

grant execute on function public.warehouse_receive_shipment(uuid, uuid, text, text) to authenticated;
grant execute on function public.warehouse_dispatch_shipment(uuid, uuid, text, text) to authenticated;
grant execute on function public.warehouse_record_storage_location(uuid, uuid, text, text) to authenticated;
grant execute on function public.office_register_incoming(uuid, uuid, text) to authenticated;
grant execute on function public.office_register_outgoing(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.office_transfer_shipment(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.office_record_handover(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.report_shipment_issue(uuid, uuid, public.issue_kind, text) to authenticated;
grant execute on function public.resolve_shipment_issue(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
