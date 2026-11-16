begin;

create type public.warehouse_operation_type as enum (
  'receive',
  'dispatch',
  'storage_record',
  'transfer_out',
  'transfer_in',
  'status_update'
);

create type public.office_operation_type as enum (
  'incoming',
  'outgoing',
  'transfer',
  'handover',
  'status_change'
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  code text not null unique check (code = upper(btrim(code)) and code <> ''),
  office_id uuid not null references public.offices (id) on delete restrict,
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.warehouse_operations (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  warehouse_id uuid not null references public.warehouses (id) on delete restrict,
  office_id uuid not null references public.offices (id) on delete restrict,
  operation_type public.warehouse_operation_type not null,
  previous_status public.shipment_status,
  new_status public.shipment_status not null,
  location text,
  notes text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.office_operations (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments (id) on delete set null,
  source_office_id uuid references public.offices (id) on delete restrict,
  destination_office_id uuid references public.offices (id) on delete restrict,
  office_id uuid not null references public.offices (id) on delete restrict,
  operation_type public.office_operation_type not null,
  previous_status public.shipment_status,
  new_status public.shipment_status,
  notes text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index warehouses_office_id_idx on public.warehouses (office_id);
create index warehouse_operations_shipment_id_idx on public.warehouse_operations (shipment_id);
create index warehouse_operations_warehouse_id_idx on public.warehouse_operations (warehouse_id);
create index warehouse_operations_office_id_idx on public.warehouse_operations (office_id);
create index warehouse_operations_created_at_idx on public.warehouse_operations (created_at desc);
create index office_operations_shipment_id_idx on public.office_operations (shipment_id);
create index office_operations_office_id_idx on public.office_operations (office_id);
create index office_operations_created_at_idx on public.office_operations (created_at desc);

alter table public.warehouses enable row level security;
alter table public.warehouse_operations enable row level security;
alter table public.office_operations enable row level security;

create or replace function public.is_warehouse_member(p_warehouse_id uuid)
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
          office_id is not null
          and office_id = (select office_id from public.warehouses where id = p_warehouse_id)
          and exists (
            select 1 from public.offices where id = public.profiles.office_id and status = 'active'
          )
        )
      )
  );
$$;

create or replace function public.can_access_warehouse(p_warehouse_id uuid)
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
          office_id is not null
          and office_id = (select office_id from public.warehouses where id = p_warehouse_id)
          and role in ('office_manager', 'storekeeper')
          and exists (
            select 1 from public.offices where id = public.profiles.office_id and status = 'active'
          )
        )
      )
  );
$$;

create policy "Admins can read all warehouses"
  on public.warehouses for select to authenticated
  using ((select public.is_admin()));

create policy "Office members can read their office warehouses"
  on public.warehouses for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
  );

create policy "Admins can insert warehouses"
  on public.warehouses for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update warehouses"
  on public.warehouses for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete warehouses"
  on public.warehouses for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can read all warehouse operations"
  on public.warehouse_operations for select to authenticated
  using ((select public.is_admin()));

create policy "Warehouse members can read their office warehouse operations"
  on public.warehouse_operations for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and (
      select public.can_access_warehouse(warehouse_id)
    )
  );

create policy "Warehouse members can insert warehouse operations"
  on public.warehouse_operations for insert to authenticated
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and (
      select public.can_access_warehouse(warehouse_id)
    )
    and created_by = (select auth.uid())
  );

create policy "Warehouse members can update their own warehouse operations"
  on public.warehouse_operations for update to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and (
      select public.can_access_warehouse(warehouse_id)
    )
    and created_by = (select auth.uid())
  )
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and (
      select public.can_access_warehouse(warehouse_id)
    )
    and created_by = (select auth.uid())
  );

create policy "Admins can read all office operations"
  on public.office_operations for select to authenticated
  using ((select public.is_admin()));

create policy "Office members can read their office operations"
  on public.office_operations for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
  );

create policy "Office members can insert office operations"
  on public.office_operations for insert to authenticated
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and created_by = (select auth.uid())
  );

create policy "Office members can update their own office operations"
  on public.office_operations for update to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and created_by = (select auth.uid())
  )
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and created_by = (select auth.uid())
  );

revoke all on public.warehouses from anon, authenticated;
revoke all on public.warehouse_operations from anon, authenticated;
revoke all on public.office_operations from anon, authenticated;
grant select on public.warehouses to authenticated;
grant select, insert on public.warehouse_operations to authenticated;
grant select, insert, update on public.office_operations to authenticated;

revoke all on function public.is_warehouse_member(uuid) from public, anon;
revoke all on function public.can_access_warehouse(uuid) from public, anon;
grant execute on function public.is_warehouse_member(uuid) to authenticated;
grant execute on function public.can_access_warehouse(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
