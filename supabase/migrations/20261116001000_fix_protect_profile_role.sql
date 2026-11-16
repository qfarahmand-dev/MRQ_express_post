begin;

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
  ) and auth.role() <> 'service_role' then
    raise exception 'Profile role, office, and account status can only be changed by trusted server operations';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update of role, office_id, account_status on public.profiles
  for each row execute function public.protect_profile_role();

revoke all on function public.protect_profile_role() from public, anon, authenticated;

commit;
