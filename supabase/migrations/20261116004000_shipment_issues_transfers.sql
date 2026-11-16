begin;

create type public.issue_kind as enum ('damaged', 'missing', 'delay');
create type public.issue_state as enum ('open', 'resolved');
create type public.transfer_state as enum ('in_transit', 'received');

create table public.shipment_issues (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  office_id uuid not null references public.offices (id) on delete restrict,
  kind public.issue_kind not null,
  description text not null check (btrim(description) <> ''),
  state public.issue_state not null default 'open',
  created_by uuid not null references auth.users (id) on delete restrict,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.shipment_transfers (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  source_office_id uuid not null references public.offices (id) on delete restrict,
  destination_office_id uuid not null references public.offices (id) on delete restrict,
  office_id uuid not null references public.offices (id) on delete restrict,
  state public.transfer_state not null default 'in_transit',
  note text,
  created_by uuid not null references auth.users (id) on delete restrict,
  received_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  received_at timestamptz,
  constraint shipment_transfers_different_offices check (source_office_id <> destination_office_id)
);

create index shipment_issues_shipment_id_idx on public.shipment_issues (shipment_id);
create index shipment_issues_office_id_idx on public.shipment_issues (office_id);
create index shipment_issues_state_idx on public.shipment_issues (state);
create index shipment_issues_created_at_idx on public.shipment_issues (created_at desc);
create index shipment_transfers_shipment_id_idx on public.shipment_transfers (shipment_id);
create index shipment_transfers_source_office_idx on public.shipment_transfers (source_office_id);
create index shipment_transfers_destination_office_idx on public.shipment_transfers (destination_office_id);
create index shipment_transfers_state_idx on public.shipment_transfers (state);
create index shipment_transfers_created_at_idx on public.shipment_transfers (created_at desc);

alter table public.shipment_issues enable row level security;
alter table public.shipment_transfers enable row level security;

create policy "Admins can read all shipment issues"
  on public.shipment_issues for select to authenticated
  using ((select public.is_admin()));

create policy "Office members can read their office shipment issues"
  on public.shipment_issues for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
  );

create policy "Office members can insert shipment issues"
  on public.shipment_issues for insert to authenticated
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and created_by = (select auth.uid())
  );

create policy "Office members can update their own open shipment issues"
  on public.shipment_issues for update to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and state = 'open'
    and created_by = (select auth.uid())
  )
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and state in ('open', 'resolved')
    and created_by = (select auth.uid())
  );

create policy "Admins can read all shipment transfers"
  on public.shipment_transfers for select to authenticated
  using ((select public.is_admin()));

create policy "Office members can read their office shipment transfers"
  on public.shipment_transfers for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
  );

create policy "Office members can insert shipment transfers"
  on public.shipment_transfers for insert to authenticated
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and created_by = (select auth.uid())
  );

create policy "Office members can update their own in_transit shipment transfers"
  on public.shipment_transfers for update to authenticated
  using (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and state = 'in_transit'
    and created_by = (select auth.uid())
  )
  with check (
    office_id is not null
    and (
      select public.can_access_office(office_id)
    )
    and state in ('in_transit', 'received')
    and created_by = (select auth.uid())
  );

revoke all on public.shipment_issues from anon, authenticated;
revoke all on public.shipment_transfers from anon, authenticated;
grant select, insert, update on public.shipment_issues to authenticated;
grant select, insert, update on public.shipment_transfers to authenticated;

notify pgrst, 'reload schema';

commit;
