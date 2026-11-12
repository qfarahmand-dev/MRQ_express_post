begin;

alter table public.shipments
  add column destination_country text not null default ''
  check (destination_country = '' or destination_country ~ '^[A-Z]{2}$');

update public.shipments
set destination_country = case
  when receiver_address ~* '(^|[,[:space:]])(Afghanistan|AFG)$' then 'AF'
  when receiver_address ~* '(^|[,[:space:]])(United Arab Emirates|UAE)$' then 'AE'
  when receiver_address ~* '(^|[,[:space:]])Australia$' then 'AU'
  when receiver_address ~* '(^|[,[:space:]])Austria$' then 'AT'
  when receiver_address ~* '(^|[,[:space:]])Belgium$' then 'BE'
  when receiver_address ~* '(^|[,[:space:]])Canada$' then 'CA'
  when receiver_address ~* '(^|[,[:space:]])China$' then 'CN'
  when receiver_address ~* '(^|[,[:space:]])France$' then 'FR'
  when receiver_address ~* '(^|[,[:space:]])Germany$' then 'DE'
  when receiver_address ~* '(^|[,[:space:]])India$' then 'IN'
  when receiver_address ~* '(^|[,[:space:]])Iran$' then 'IR'
  when receiver_address ~* '(^|[,[:space:]])Italy$' then 'IT'
  when receiver_address ~* '(^|[,[:space:]])Japan$' then 'JP'
  when receiver_address ~* '(^|[,[:space:]])Malaysia$' then 'MY'
  when receiver_address ~* '(^|[,[:space:]])Netherlands$' then 'NL'
  when receiver_address ~* '(^|[,[:space:]])Pakistan$' then 'PK'
  when receiver_address ~* '(^|[,[:space:]])Saudi Arabia$' then 'SA'
  when receiver_address ~* '(^|[,[:space:]])Spain$' then 'ES'
  when receiver_address ~* '(^|[,[:space:]])Switzerland$' then 'CH'
  when receiver_address ~* '(^|[,[:space:]])(Türkiye|Turkey|Turkiye)$' then 'TR'
  when receiver_address ~* '(^|[,[:space:]])(United Kingdom|UK|Great Britain)$' then 'GB'
  when receiver_address ~* '(^|[,[:space:]])(United States|USA)$' then 'US'
  else ''
end
where destination_country = '';

create index shipments_destination_country_idx
  on public.shipments (destination_country)
  where destination_country <> '';

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
  p_destination_country text
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
    p_status
  );

  update public.shipments
  set destination_country = upper(btrim(p_destination_country))
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
  p_destination_country text
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
    p_status
  );

  update public.shipments
  set destination_country = upper(btrim(p_destination_country))
  where id = updated_id;

  return updated_id;
end;
$$;

drop function public.get_shipment_stats();

create function public.get_shipment_stats()
returns table (total bigint, in_warehouse bigint, in_transit bigint, delivered bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) as total,
    count(*) filter (where status = 'in_warehouse') as in_warehouse,
    count(*) filter (where status in ('dispatched', 'in_transit', 'out_for_delivery')) as in_transit,
    count(*) filter (where status = 'delivered') as delivered
  from public.shipments;
$$;

create function public.get_shipment_reports()
returns table (
  this_week bigint,
  this_month bigint,
  this_year bigint,
  top_destinations jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) filter (
      where registration_date >= date_trunc('week', current_date)::date
        and registration_date <= current_date
    ) as this_week,
    count(*) filter (
      where registration_date >= date_trunc('month', current_date)::date
        and registration_date <= current_date
    ) as this_month,
    count(*) filter (
      where registration_date >= date_trunc('year', current_date)::date
        and registration_date <= current_date
    ) as this_year,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('country', destination_country, 'total', shipment_count)
          order by shipment_count desc, destination_country asc
        )
        from (
          select destination_country, count(*) as shipment_count
          from public.shipments
          where destination_country <> ''
          group by destination_country
          order by shipment_count desc, destination_country asc
          limit 5
        ) as destinations
      ),
      '[]'::jsonb
    ) as top_destinations
  from public.shipments;
$$;

revoke all on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text) from public, anon;
revoke all on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text) from public, anon;
revoke all on function public.get_shipment_stats() from public, anon;
revoke all on function public.get_shipment_reports() from public, anon;
grant execute on function public.create_shipment(text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text) to authenticated;
grant execute on function public.update_shipment(uuid, text, text, text, text, text, text, text, public.package_type, text, date, public.shipment_status, text) to authenticated;
grant execute on function public.get_shipment_stats() to authenticated;
grant execute on function public.get_shipment_reports() to authenticated;

notify pgrst, 'reload schema';

commit;
