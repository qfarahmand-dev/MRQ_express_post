begin;

-- Add must_change_password column to profiles table
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Create index for faster must_change_password lookups
create index if not exists profiles_must_change_password_idx on public.profiles (must_change_password);

-- Update handle_new_auth_user() trigger to remove user_invites dependency
-- and set must_change_password = true for all new accounts
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.user_invites%rowtype;
begin
  -- New direct account creation: create profile with must_change_password = true
  -- No longer depends on user_invites table or admin_allowlist for basic access
  insert into public.profiles (id, full_name, role, office_id, account_status, must_change_password)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'admin'), '@', 1)
    ),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'role'), ''), 'storekeeper'),
    case
      when coalesce(nullif(btrim(new.raw_user_meta_data ->> 'role'), ''), 'storekeeper') = 'admin' then null
      else nullif(btrim(new.raw_user_meta_data ->> 'office_id'), '')::uuid
    end,
    'active',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

commit;
