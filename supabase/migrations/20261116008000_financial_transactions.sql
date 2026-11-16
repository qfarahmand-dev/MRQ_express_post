begin;

create type public.financial_transaction_type as enum ('revenue', 'expense');

create type public.financial_transaction_category as enum (
  'shipping_fee',
  'handling_fee',
  'storage_fee',
  'transport_cost',
  'office_expense',
  'warehouse_expense',
  'employee_payment',
  'other'
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete restrict,
  type public.financial_transaction_type not null,
  category public.financial_transaction_category not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'AFN' check (btrim(currency) <> ''),
  description text not null check (btrim(description) <> ''),
  reference_type text,
  reference_id text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index financial_transactions_office_id_idx on public.financial_transactions (office_id);
create index financial_transactions_type_idx on public.financial_transactions (type);
create index financial_transactions_created_at_idx on public.financial_transactions (created_at desc);
create index financial_transactions_category_idx on public.financial_transactions (category);

alter table public.financial_transactions enable row level security;

create or replace function public.can_view_financial_reports(p_office_id uuid)
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
          role = 'office_manager'
          and office_id = p_office_id
          and exists (
            select 1 from public.offices where id = p_office_id and status = 'active'
          )
        )
      )
  );
$$;

create policy "Admins can read all financial transactions"
  on public.financial_transactions for select to authenticated
  using ((select public.is_admin()));

create policy "Office managers can read their office financial transactions"
  on public.financial_transactions for select to authenticated
  using (
    office_id is not null
    and (
      select public.can_view_financial_reports(office_id)
    )
  );

create policy "Admins can insert financial transactions"
  on public.financial_transactions for insert to authenticated
  with check ((select public.is_admin()));

create policy "Office managers can insert their office financial transactions"
  on public.financial_transactions for insert to authenticated
  with check (
    office_id is not null
    and (
      select public.can_view_financial_reports(office_id)
    )
    and created_by = (select auth.uid())
  );

create policy "No one can update financial transactions"
  on public.financial_transactions for update to authenticated
  using (false)
  with check (false);

create policy "No one can delete financial transactions"
  on public.financial_transactions for delete to authenticated
  using (false);

revoke all on public.financial_transactions from anon, authenticated;
grant select, insert on public.financial_transactions to authenticated;

revoke all on function public.can_view_financial_reports(uuid) from public, anon;
grant execute on function public.can_view_financial_reports(uuid) to authenticated;

create or replace function public.get_financial_summary(
  p_office_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  total_revenue numeric(12, 2),
  total_expense numeric(12, 2),
  net_balance numeric(12, 2),
  transaction_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(case when type = 'revenue' then amount else 0 end), 0) as total_revenue,
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as total_expense,
    coalesce(sum(case when type = 'revenue' then amount else -amount end), 0) as net_balance,
    count(*) as transaction_count
  from public.financial_transactions
  where office_id = p_office_id
    and created_at::date >= p_start_date
    and created_at::date <= p_end_date;
$$;

revoke all on function public.get_financial_summary(uuid, date, date) from public, anon;
grant execute on function public.get_financial_summary(uuid, date, date) to authenticated;

notify pgrst, 'reload schema';

commit;
