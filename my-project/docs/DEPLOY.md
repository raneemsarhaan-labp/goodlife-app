# Deploying to Vercel with Supabase

The build applies database migrations itself (`scripts/migrate.mjs`, run by `npm run build`), so a new
environment needs only a Supabase database connected to the Vercel project and one setting for the
first admin.

## 1. Create the database (Vercel → Storage)

Vercel project **goodlife-app** → **Storage** → **Create Database** → **Supabase** → connect it to the
project for Production and Preview. The integration adds `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `POSTGRES_URL_NON_POOLING`.

## 2. Name the first admin

Vercel → Settings → Environment Variables → `BOOTSTRAP_ADMIN_EMAIL` = your email (Production).
Optional: `NEXT_PUBLIC_SITE_URL` (defaults to the project's production domain).

## 3. Supabase sign-in by code

Supabase dashboard → Authentication:

- **Sign In / Providers → Email**: enabled; "Confirm email" off; OTP length 6.
- **Emails → Magic Link** template: paste `supabase/templates/sign-in-code.html` (it shows `{{ .Token }}`).
- **URL Configuration**: Site URL = the Vercel production URL; add it to Redirect URLs.

## 4. Deploy

Redeploy in Vercel. The build log shows `[migrate] …` lines: 22 files applied on the first deploy (21
migrations and the starter content), then the first-admin invitation code. Open `/join`, enter that
code and the `BOOTSTRAP_ADMIN_EMAIL` address: that account becomes admin. Later deploys apply only new
migrations.

## Notes

- Demo people and cohorts (`supabase/seed.sql`) are local only; production gets `supabase/content.sql`.
- Supabase's built-in email sender is rate-limited; set up custom SMTP (Authentication → SMTP) before
  inviting a cohort.
