begin;

create or replace function public.can_access_shipment(p_shipment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shipments
    where id = p_shipment_id
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
              and account_status = 'active'
              and office_id = shipments.office_id
          )
        )
      )
  );
$$;

revoke all on function public.can_access_shipment(uuid) from public, anon;
grant execute on function public.can_access_shipment(uuid) to authenticated;

drop policy if exists "Admins can view shipment photos" on storage.objects;
drop policy if exists "Admins can upload shipment photos" on storage.objects;
drop policy if exists "Admins can replace shipment photos" on storage.objects;
drop policy if exists "Admins can delete shipment photos" on storage.objects;

create policy "Authorized users can view shipment photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'shipment-private'
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
      where (select public.can_access_shipment(id))
    )
  );

create policy "Authorized users can upload shipment photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shipment-private'
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
      where (select public.can_access_shipment(id))
    )
  );

create policy "Authorized users can replace shipment photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'shipment-private'
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
      where (select public.can_access_shipment(id))
    )
  )
  with check (
    bucket_id = 'shipment-private'
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
      where (select public.can_access_shipment(id))
    )
  );

create policy "Authorized users can delete shipment photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shipment-private'
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
      where (select public.can_access_shipment(id))
    )
  );

commit;
