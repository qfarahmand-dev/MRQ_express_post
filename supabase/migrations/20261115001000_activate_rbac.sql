begin;

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  code text not null unique check (code = upper(btrim(code)) and code <> ''),
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column office_id uuid references public.offices (id) on delete restrict,
  add column account_status text not null default 'active'
    check (account_status in ('active', 'inactive')),
  add constraint profiles_role_office_assignment_check
    check (
      (role = 'admin' and office_id is null)
      or (role in ('office_manager', 'storekeeper') and office_id is not null)
    );

alter table public.shipments
  add column office_id uuid references public.offices (id) on delete set null;

create index profiles_office_role_idx on public.profiles (office_id, role);
create index shipments_office_created_idx on public.shipments (office_id, created_at desc);

create table public.user_invites (
  email text primary key check (email = lower(btrim(email)) and email <> ''),
  full_name text not null check (btrim(full_name) <> ''),
  role public.app_role not null,
  office_id uuid references public.offices (id) on delete restrict,
  invited_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  constraint user_invites_role_office_assignment_check
    check (
      (role = 'admin' and office_id is null)
      or (role in ('office_manager', 'storekeeper') and office_id is not null)
    )
);

alter table public.user_invites enable row level security;
revoke all on public.user_invites from public, anon, authenticated;
grant all on public.user_invites to service_role;

create or replace function public.is_admin()
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
      and account_status = 'active'
  );
$$;

create or replace function public.can_access_office(p_office_id uuid)
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
      and (
        role = 'admin'
        or (
          office_id = p_office_id
          and exists (
            select 1 from public.offices where id = p_office_id and status = 'active'
          )
        )
      )
  );
$$;

create or replace function public.is_office_manager_for(p_office_id uuid)
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
      and role = 'office_manager'
      and account_status = 'active'
      and office_id = p_office_id
      and exists (
        select 1 from public.offices where id = p_office_id and status = 'active'
      )
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.user_invites%rowtype;
begin
  select *
    into invitation
    from public.user_invites
    where email = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    for update;

  if found then
    insert into public.profiles (id, full_name, role, office_id, account_status)
    values (new.id, invitation.full_name, invitation.role, invitation.office_id, 'active')
    on conflict (id) do nothing;

    update public.user_invites
    set accepted_at = now()
    where email = invitation.email;
    return new;
  end if;

  if new.email is null or not exists (
    select 1
    from public.admin_allowlist
    where email = lower(new.email)
  ) then
    raise exception 'This email is not authorized to access MRQ Express Post';
  end if;

  insert into public.profiles (id, full_name, role, office_id, account_status)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'admin'), '@', 1)
    ),
    'admin',
    null,
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_role_immutable on public.profiles;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.role is distinct from old.role
    or new.office_id is distinct from old.office_id
    or new.account_status is distinct from old.account_status
  ) and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Profile role, office, and account status can only be changed by trusted server operations';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update of role, office_id, account_status on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.assign_shipment_office()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_office_id uuid;
  assigned_role public.app_role;
begin
  select role, office_id
    into assigned_role, assigned_office_id
    from public.profiles
    where id = (select auth.uid())
      and account_status = 'active';

  if not found then
    raise exception 'An active MRQ Express Post profile is required';
  end if;

  if assigned_role <> 'admin' then
    if assigned_office_id is null then
      raise exception 'An office assignment is required';
    end if;
    if new.office_id is not null and new.office_id <> assigned_office_id then
      raise exception 'Shipments can only be registered in the assigned office';
    end if;
    new.office_id := assigned_office_id;
    if not exists (
      select 1 from public.offices
      where id = assigned_office_id and status = 'active'
    ) then
      raise exception 'An active office assignment is required';
    end if;
  end if;

  return new;
end;
$$;

create trigger shipments_assign_office
  before insert on public.shipments
  for each row execute function public.assign_shipment_office();

drop policy if exists "Admins can read their profile" on public.profiles;
drop policy if exists "Admins can update their profile" on public.profiles;
create policy "Users can read permitted profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or (office_id is not null and (select public.is_office_manager_for(office_id)))
  );
create policy "Users can update their own name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter table public.offices enable row level security;
create policy "Users can read permitted offices"
  on public.offices for select to authenticated
  using (
    (select public.is_admin())
    or (select public.can_access_office(id))
  );
revoke all on public.offices from anon, authenticated;
grant select on public.offices to authenticated;
grant all on public.offices to service_role;

drop policy if exists "Admins can read shipments" on public.shipments;
drop policy if exists "Admins can insert shipments" on public.shipments;
drop policy if exists "Admins can update shipments" on public.shipments;
drop policy if exists "Admins can delete shipments" on public.shipments;
create policy "Authorized users can read office shipments"
  on public.shipments for select to authenticated
  using (
    (select public.is_admin())
    or (
      office_id is not null
      and (select public.can_access_office(office_id))
      and exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role in ('office_manager', 'storekeeper')
      )
    )
  );
create policy "Admins and office managers can insert shipments"
  on public.shipments for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (select public.is_admin())
      or (
        office_id is not null
        and (select public.is_office_manager_for(office_id))
      )
      or (
        office_id is not null
        and status in ('registered', 'in_warehouse')
        and exists (
          select 1
          from public.profiles
          where id = (select auth.uid())
            and role = 'storekeeper'
            and account_status = 'active'
            and office_id = shipments.office_id
        )
      )
    )
  );
create policy "Admins and office managers can update shipments"
  on public.shipments for update to authenticated
  using (
    (select public.is_admin())
    or (
      office_id is not null
      and (select public.is_office_manager_for(office_id))
    )
  )
  with check (
    (select public.is_admin())
    or (
      office_id is not null
      and (select public.is_office_manager_for(office_id))
    )
  );
create policy "Admins can delete shipments"
  on public.shipments for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can read shipment events" on public.shipment_events;
drop policy if exists "Admins can insert shipment events" on public.shipment_events;
create policy "Authorized users can read office shipment events"
  on public.shipment_events for select to authenticated
  using (
    exists (
      select 1
      from public.shipments
      where id = shipment_id
        and (
          (select public.is_admin())
          or (
            office_id is not null
            and (select public.can_access_office(office_id))
            and exists (
              select 1
              from public.profiles
              where id = (select auth.uid())
                and role in ('office_manager', 'storekeeper')
            )
          )
        )
    )
  );
create policy "Admins and office managers can insert shipment events"
  on public.shipment_events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.shipments
      where id = shipment_id
        and (
          (select public.is_admin())
          or (
            office_id is not null
            and (select public.is_office_manager_for(office_id))
          )
        )
    )
  );

create or replace function public.warehouse_update_shipment_status(
  p_shipment_id uuid,
  p_status public.shipment_status,
  p_location text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_office_id uuid;
  previous_status public.shipment_status;
  updated_id uuid;
begin
  select office_id
    into assigned_office_id
    from public.profiles
    where id = (select auth.uid())
      and role = 'storekeeper'
      and account_status = 'active';
  if not found or assigned_office_id is null then
    raise insufficient_privilege using message = 'An active storekeeper profile is required';
  end if;
  if not exists (
    select 1 from public.offices
    where id = assigned_office_id and status = 'active'
  ) then
    raise insufficient_privilege using message = 'The assigned office is inactive';
  end if;

  select status
    into previous_status
    from public.shipments
    where id = p_shipment_id
      and office_id = assigned_office_id
    for update;
  if not found then
    raise no_data_found using message = 'Shipment not found in the assigned office';
  end if;

  if not (
    (previous_status = 'registered' and p_status = 'in_warehouse')
    or (previous_status = 'in_warehouse' and p_status = 'dispatched')
    or (previous_status = 'dispatched' and p_status = 'in_transit')
  ) then
    raise check_violation using message = 'This warehouse status transition is not permitted';
  end if;

  update public.shipments
  set status = p_status
  where id = p_shipment_id
  returning id into updated_id;

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

revoke all on function public.can_access_office(uuid) from public, anon;
revoke all on function public.is_office_manager_for(uuid) from public, anon;
revoke all on function public.warehouse_update_shipment_status(uuid, public.shipment_status, text, text) from public, anon;
grant execute on function public.can_access_office(uuid) to authenticated;
grant execute on function public.is_office_manager_for(uuid) to authenticated;
grant execute on function public.warehouse_update_shipment_status(uuid, public.shipment_status, text, text) to authenticated;
revoke all on function public.assign_shipment_office() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;

commit;
