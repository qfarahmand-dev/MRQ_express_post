-- Replace restrictive DELETE RLS policy on shipments.
-- Office managers can now delete shipments belonging to their assigned office only.
-- Storekeepers cannot delete shipments.
-- Admins can delete shipments across all offices.
--
-- Uses the trusted server-side helper is_office_manager_for(office_id)
-- which validates against the authenticated user's profile, never trusting
-- client-supplied values.

drop policy if exists "Admins can delete shipments" on public.shipments;

create policy "Admins and office managers can delete office shipments"
  on public.shipments for delete to authenticated
  using (
    (select public.is_admin())
    or (
      office_id is not null
      and (select public.is_office_manager_for(office_id))
    )
  );

commit;
