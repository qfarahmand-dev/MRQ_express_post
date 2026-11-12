# Supabase and Vercel setup

The app has no public sign-up page. Create administrator accounts from the Supabase dashboard; every account provisioned there receives the only supported role, `admin`.

## 1. Create the database

1. Create a Supabase project.
2. Open **SQL Editor**, paste and run [`migrations/20261112000000_initial_schema.sql`](./migrations/20261112000000_initial_schema.sql), then [`migrations/20261113000000_destination_reporting.sql`](./migrations/20261113000000_destination_reporting.sql).
3. Add each approved administrator email to the private allowlist from **SQL Editor**, replacing the example address:

   ```sql
   insert into public.admin_allowlist (email) values (lower(btrim('admin@example.com')));
   ```

4. In **Authentication → Settings**, turn off public sign-ups. The database trigger rejects any Auth user whose email is not allowlisted and gives approved users the only `admin` role.
5. In **Authentication → Users**, create or invite the approved administrator and set a strong password. Set the user's `full_name` metadata if you want a display name other than the email prefix.

The database creates a profile when an allowlisted Auth user is created or when an existing user's email is added to the allowlist. RLS protects profile, shipment, and event tables. Public shipment tracking uses a restricted RPC and does not expose contact details or full addresses. The reporting migration adds a required destination-country field to new and edited shipments, plus administrator-only shipment summary RPCs. It backfills existing shipments only when their address ends in a recognized country name; other existing shipments should be edited to select their country and are excluded from the ranking until then. Weekly, monthly, and yearly totals use registration dates within the current calendar period.

## 2. Configure local development

Copy `.env.example` to `.env.local` and set values from **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable key belongs in the browser. Never add a `service_role` or secret key to this app.

Run the app with `pnpm dev`, then sign in at `/login` using the administrator credentials created above. There is intentionally no demo-login or public registration path.

## 3. Deploy to Vercel

1. Import the Git repository into Vercel and keep the default Next.js build settings.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel **Production** environment (and Preview/Development if needed).
3. In Supabase **Authentication → URL Configuration**, set the production Vercel domain as the Site URL. Add the production and any preview login/callback URLs to the allowed redirect URLs.
4. Redeploy after changing environment variables.
5. Test login/logout, protected dashboard routes, creating/updating/deleting shipments, event history, and public tracking on the deployed site.

Vercel environment variables and the Supabase SQL migration must be configured in their respective dashboards; this repository cannot apply them without access to your accounts.
