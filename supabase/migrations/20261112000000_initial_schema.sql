begin;

create type public.app_role as enum ('admin');
create type public.shipment_status as enum (
  'registered',
  'in_warehouse',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delayed',
  'returned',
  'cancelled'
);
create type public.package_type as enum ('documents', 'goods');

create table public.admin_allowlist (
  email text primary key check (email <> '' and email = lower(btrim(email)))
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique
    check (tracking_number ~ '^[A-Z0-9-]{1,25}$'),
  sender_name text not null,
  sender_phone text not null,
  sender_address text not null,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_address text not null,
  package_type public.package_type not null,
  description text not null default '',
  registration_date date not null,
  status public.shipment_status not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status public.shipment_status not null,
  location text,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index shipment_events_shipment_created_idx
  on public.shipment_events (shipment_id, created_at);
create index shipments_created_at_idx on public.shipments (created_at desc);

create function public.is_admin()
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
      and role = 'admin'
  );
$$;

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or not exists (
    select 1
    from public.admin_allowlist
    where email = lower(new.email)
  ) then
    raise exception 'This email is not authorized to access the administrator dashboard';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'admin'), '@', 1)
    ),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create function public.handle_admin_allowlist_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  select
    id,
    coalesce(
      nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(email, 'admin'), '@', 1)
    ),
    'admin'
  from auth.users
  where lower(auth.users.email) = new.email
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_admin_allowlist_added
  after insert on public.admin_allowlist
  for each row execute function public.handle_admin_allowlist_added();

insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(email, 'admin'), '@', 1)
  ),
  'admin'
from auth.users
where exists (
  select 1
  from public.admin_allowlist
  where email = lower(auth.users.email)
)
on conflict (id) do nothing;

create function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Profile roles cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update of role on public.profiles
  for each row execute function public.protect_profile_role();

create function public.set_shipment_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_shipment_updated_at();

create function public.record_initial_shipment_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.shipment_events (shipment_id, status, created_by)
  values (new.id, new.status, new.created_by);
  return new;
end;
$$;

create trigger shipment_initial_event
  after insert on public.shipments
  for each row execute function public.record_initial_shipment_event();

create function public.create_shipment(
  p_tracking_number text,
  p_sender_name text,
  p_sender_phone text,
  p_sender_address text,
  p_receiver_name text,
  p_receiver_phone text,
  p_receiver_address text,
  p_package_type public.package_type,
  p_description text,
  p_registration_date date,
  p_status public.shipment_status
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
  new_tracking_number text;
begin
  new_tracking_number := nullif(upper(btrim(p_tracking_number)), '');
  if new_tracking_number is null then
    loop
      new_tracking_number := 'MRQ' || floor(random() * 900000000 + 100000000)::bigint::text;
      exit when not exists (
        select 1 from public.shipments where tracking_number = new_tracking_number
      );
    end loop;
  end if;

  insert into public.shipments (
    tracking_number,
    sender_name,
    sender_phone,
    sender_address,
    receiver_name,
    receiver_phone,
    receiver_address,
    package_type,
    description,
    registration_date,
    status,
    created_by
  )
  values (
    new_tracking_number,
    btrim(p_sender_name),
    btrim(p_sender_phone),
    btrim(p_sender_address),
    btrim(p_receiver_name),
    btrim(p_receiver_phone),
    btrim(p_receiver_address),
    p_package_type,
    btrim(p_description),
    p_registration_date,
    p_status,
    (select auth.uid())
  )
  returning id into new_id;

  return new_id;
end;
$$;

create function public.update_shipment(
  p_shipment_id uuid,
  p_tracking_number text,
  p_sender_name text,
  p_sender_phone text,
  p_sender_address text,
  p_receiver_name text,
  p_receiver_phone text,
  p_receiver_address text,
  p_package_type public.package_type,
  p_description text,
  p_registration_date date,
  p_status public.shipment_status
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_status public.shipment_status;
  updated_id uuid;
begin
  select status
    into old_status
    from public.shipments
    where id = p_shipment_id
    for update;
  if not found then
    raise no_data_found using message = 'Shipment not found';
  end if;

  update public.shipments
  set tracking_number = coalesce(nullif(upper(btrim(p_tracking_number)), ''), tracking_number),
      sender_name = btrim(p_sender_name),
      sender_phone = btrim(p_sender_phone),
      sender_address = btrim(p_sender_address),
      receiver_name = btrim(p_receiver_name),
      receiver_phone = btrim(p_receiver_phone),
      receiver_address = btrim(p_receiver_address),
      package_type = p_package_type,
      description = btrim(p_description),
      registration_date = p_registration_date,
      status = p_status
  where id = p_shipment_id
  returning id into updated_id;

  if old_status is distinct from p_status then
    insert into public.shipment_events (shipment_id, status, created_by)
    values (updated_id, p_status, (select auth.uid()));
  end if;

  return updated_id;
end;
$$;

create function public.update_shipment_status(
  p_shipment_id uuid,
  p_status public.shipment_status,
  p_location text,
  p_note text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  update public.shipments
  set status = p_status
  where id = p_shipment_id
  returning id into updated_id;
  if not found then
    raise no_data_found using message = 'Shipment not found';
  end if;

  insert into public.shipment_events (shipment_id, status, location, note, created_by)
  values (
    updated_id,
    p_status,
    nullif(btrim(p_location), ''),
    nullif(btrim(p_note), ''),
    (select auth.uid())
  );

  return updated_id;
end;
$$;

create function public.get_shipment_stats()
returns table (total bigint, registered bigint, in_transit bigint, delivered bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) as total,
    count(*) filter (where status = 'registered') as registered,
    count(*) filter (where status in ('dispatched', 'in_transit', 'out_for_delivery')) as in_transit,
    count(*) filter (where status = 'delivered') as delivered
  from public.shipments;
$$;

create function public.track_shipment(p_tracking_number text)
returns table (
  tracking_number text,
  sender_name text,
  receiver_name text,
  package_type public.package_type,
  status public.shipment_status,
  registration_date date,
  updated_at timestamptz,
  events jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.tracking_number,
    case
      when array_length(regexp_split_to_array(btrim(s.sender_name), E'\\s+'), 1) > 1 then
        (regexp_split_to_array(btrim(s.sender_name), E'\\s+'))[1] || ' ' ||
        left(
          (regexp_split_to_array(btrim(s.sender_name), E'\\s+'))[
            array_length(regexp_split_to_array(btrim(s.sender_name), E'\\s+'), 1)
          ],
          1
        ) || '.'
      else left(btrim(s.sender_name), 1) || '***'
    end as sender_name,
    case
      when array_length(regexp_split_to_array(btrim(s.receiver_name), E'\\s+'), 1) > 1 then
        (regexp_split_to_array(btrim(s.receiver_name), E'\\s+'))[1] || ' ' ||
        left(
          (regexp_split_to_array(btrim(s.receiver_name), E'\\s+'))[
            array_length(regexp_split_to_array(btrim(s.receiver_name), E'\\s+'), 1)
          ],
          1
        ) || '.'
      else left(btrim(s.receiver_name), 1) || '***'
    end as receiver_name,
    s.package_type,
    s.status,
    s.registration_date,
    s.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'status', e.status,
            'location', e.location,
            'note', e.note,
            'createdAt', e.created_at
          )
          order by e.created_at
        )
        from public.shipment_events e
        where e.shipment_id = s.id
      ),
      '[]'::jsonb
    ) as events
  from public.shipments s
  where s.tracking_number = upper(btrim(p_tracking_number))
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.admin_allowlist enable row level security;

create policy "Admins can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Admins can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Admins can read shipments"
  on public.shipments for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can insert shipments"
  on public.shipments for insert to authenticated
  with check ((select public.is_admin()) and created_by = (select auth.uid()));
create policy "Admins can update shipments"
  on public.shipments for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete shipments"
  on public.shipments for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can read shipment events"
  on public.shipment_events for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can insert shipment events"
  on public.shipment_events for insert to authenticated
  with check ((select public.is_admin()) and created_by = (select auth.uid()));

revoke all on public.admin_allowlist, public.profiles, public.shipments, public.shipment_events from anon, authenticated;
grant select, update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.shipments to authenticated;
grant select, insert on public.shipment_events to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.handle_admin_allowlist_added() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.set_shipment_updated_at() from public, anon, authenticated;
revoke all on function public.record_initial_shipment_event() from public, anon, authenticated;
revoke all on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status) from public, anon;
revoke all on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status) from public, anon;
revoke all on function public.update_shipment_status(uuid, public.shipment_status, text, text) from public, anon;
revoke all on function public.get_shipment_stats() from public, anon;
revoke all on function public.track_shipment(text) from public;
grant execute on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status) to authenticated;
grant execute on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status) to authenticated;
grant execute on function public.update_shipment_status(uuid, public.shipment_status, text, text) to authenticated;
grant execute on function public.get_shipment_stats() to authenticated;
grant execute on function public.track_shipment(text) to anon, authenticated;

commit;
