begin;

create type public.shipping_company as enum ('UPS', 'DHL', 'DPD');

alter table public.shipments
  alter column tracking_number drop not null,
  drop constraint shipments_tracking_number_check,
  add constraint shipments_tracking_number_format_check
    check (tracking_number is null or tracking_number ~ '^[A-Z0-9]{1,25}$'),
  add column weight_kg numeric not null default 0 check (weight_kg >= 0),
  add column length_cm numeric check (length_cm is null or length_cm > 0),
  add column width_cm numeric check (width_cm is null or width_cm > 0),
  add column height_cm numeric check (height_cm is null or height_cm > 0),
  add column shipping_company public.shipping_company,
  add column received_date date,
  add column sender_id_photo_path text,
  add column receiver_home_photo_path text,
  add constraint shipments_received_date_check
    check (received_date is null or received_date >= registration_date);

update public.shipments
set tracking_number = null
where tracking_number = '';

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
  p_status public.shipment_status,
  p_destination_country text,
  p_weight_kg numeric,
  p_length_cm numeric,
  p_width_cm numeric,
  p_height_cm numeric,
  p_shipping_company public.shipping_company,
  p_received_date date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  new_id := public.create_shipment(
    p_tracking_number,
    p_sender_name,
    p_sender_phone,
    p_sender_address,
    p_receiver_name,
    p_receiver_phone,
    p_receiver_address,
    p_package_type,
    p_description,
    p_registration_date,
    p_status,
    p_destination_country
  );

  update public.shipments
  set tracking_number = nullif(upper(btrim(p_tracking_number)), ''),
      weight_kg = p_weight_kg,
      length_cm = p_length_cm,
      width_cm = p_width_cm,
      height_cm = p_height_cm,
      shipping_company = p_shipping_company,
      received_date = p_received_date
  where id = new_id;

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
  p_status public.shipment_status,
  p_destination_country text,
  p_weight_kg numeric,
  p_length_cm numeric,
  p_width_cm numeric,
  p_height_cm numeric,
  p_shipping_company public.shipping_company,
  p_received_date date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  updated_id := public.update_shipment(
    p_shipment_id,
    p_tracking_number,
    p_sender_name,
    p_sender_phone,
    p_sender_address,
    p_receiver_name,
    p_receiver_phone,
    p_receiver_address,
    p_package_type,
    p_description,
    p_registration_date,
    p_status,
    p_destination_country
  );

  update public.shipments
  set tracking_number = nullif(upper(btrim(p_tracking_number)), ''),
      weight_kg = p_weight_kg,
      length_cm = p_length_cm,
      width_cm = p_width_cm,
      height_cm = p_height_cm,
      shipping_company = p_shipping_company,
      received_date = p_received_date
  where id = updated_id;

  return updated_id;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipment-private',
  'shipment-private',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can view shipment photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'shipment-private'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
    )
  );

create policy "Admins can upload shipment photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shipment-private'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
    )
  );

create policy "Admins can replace shipment photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'shipment-private'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
    )
  )
  with check (
    bucket_id = 'shipment-private'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in (
      select id::text from public.shipments
    )
  );

create policy "Admins can delete shipment photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shipment-private' and (select public.is_admin()));

revoke all on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text, numeric, numeric, numeric, numeric, public.shipping_company, date) from public, anon;
revoke all on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text, numeric, numeric, numeric, numeric, public.shipping_company, date) from public, anon;
grant execute on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text, numeric, numeric, numeric, numeric, public.shipping_company, date) to authenticated;
grant execute on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text, numeric, numeric, numeric, numeric, public.shipping_company, date) to authenticated;

notify pgrst, 'reload schema';

commit;
