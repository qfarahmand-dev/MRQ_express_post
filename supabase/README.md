# Supabase and Vercel setup

The app has no public sign-up page. Create the initial administrator from Supabase; Admins can then create offices and invite Office Managers and Storekeepers from the dashboard.

## 1. Create the database

1. Create a Supabase project.
2. Back up the project, then open **SQL Editor** and run the existing baseline migrations first, in order:
   [`migrations/20261112000000_initial_schema.sql`](./migrations/20261112000000_initial_schema.sql),
   [`migrations/20261113000000_destination_reporting.sql`](./migrations/20261113000000_destination_reporting.sql), then
   [`migrations/20261114000000_shipment_details_and_private_photos.sql`](./migrations/20261114000000_shipment_details_and_private_photos.sql).
3. If those baseline migrations are already applied, do not rerun them. Instead, execute [`migrations/20261115000000_add_office_roles.sql`](./migrations/20261115000000_add_office_roles.sql) by itself, wait for it to complete successfully, and only then execute [`migrations/20261115001000_activate_rbac.sql`](./migrations/20261115001000_activate_rbac.sql) in a separate SQL Editor run. The enum values must be committed before the next migration uses them.
4. For a new database only, add each approved initial administrator email to the private allowlist from **SQL Editor**, replacing the example address:

   ```sql
   insert into public.admin_allowlist (email) values (lower(btrim('admin@example.com')));
   ```

5. In **Authentication → URL Configuration**, set the Site URL to your app origin and add these Redirect URLs:

   ```text
   http://localhost:3000/auth/callback
   https://your-production-domain/auth/callback
   ```

   Add any preview callback URLs you use. Keep the Supabase invitation email template's confirmation link intact; the application supplies the callback redirect when sending invitations.
6. In **Authentication → Settings**, turn off public sign-ups. The allowlist is for initial administrator provisioning; later invitations are created from the authenticated management UI.
7. For a new database only, in **Authentication → Users**, create or invite the approved initial administrator and set a strong password. Existing migrated projects should keep their current administrator accounts.

The RBAC migration adds the only supported roles—`admin`, `office_manager`, and `storekeeper`—along with office assignments, account status, invitation records, and office-scoped shipment row policies. Existing profiles remain Admins. Existing shipments are left unassigned (`office_id` is null), so an Admin must assign them before office users can access them. The Auth trigger provisions invited accounts with the role and office recorded by the server-side invite flow.

RLS protects profile, office, shipment, and event rows. Public shipment tracking uses a restricted RPC and does not expose contact details, full addresses, or private photos. The reporting migration adds a required destination-country field to new and edited shipments, plus administrator-only shipment summary RPCs. It backfills existing shipments only when their address ends in a recognized country name; other existing shipments should be edited to select their country and are excluded from the ranking until then. Weekly, monthly, and yearly totals use registration dates within the current calendar period.

The shipment-details migration makes tracking numbers optional, adds weight, dimensions, carrier and received-date fields, and creates a private Storage bucket for sender ID/passport and receiver-home photos. Photos are restricted to administrators and limited to JPEG, PNG or WebP files up to 5 MB. Existing shipments retain unknown weight and carrier values until an administrator edits them.

If the dashboard or Reports page reports a database/schema error, make sure the destination-reporting migration has been run. The initial schema alone does not include `get_shipment_reports()` and uses an older stats response.

## 2. Configure local development

Copy `.env.example` to `.env.local` and set values from **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The publishable key may be used in the browser. `SUPABASE_SERVICE_ROLE_KEY` is only for Next.js server-side management routes; never prefix it with `NEXT_PUBLIC_`, expose it to client code, or commit a real key.

New users are invited by an Admin from User Management. The invitation link returns to `/auth/callback`, establishes the Supabase session, and opens `/invite/complete` so the user can set a password. Office Managers may invite Storekeepers only for their own office. Account roles, assignments, and active status are validated by the server and protected by database policies.

Run the app with `pnpm dev`, then sign in at `/login` using the administrator credentials created above. There is intentionally no demo-login or public registration path.

## 3. Deploy to Vercel

1. Import the Git repository into Vercel and keep the default Next.js build settings.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the Vercel **Production** environment (and Preview/Development if needed). Keep the service-role key server-only.
3. In Supabase **Authentication → URL Configuration**, set the production Vercel domain as the Site URL. Add the production and any preview login/callback URLs to the allowed redirect URLs.
4. Redeploy after changing environment variables.
5. Test login/logout, protected dashboard routes, creating/updating/deleting shipments, event history, and public tracking on the deployed site.

Vercel environment variables and the Supabase SQL migration must be configured in their respective dashboards; this repository cannot apply them without access to your accounts.
