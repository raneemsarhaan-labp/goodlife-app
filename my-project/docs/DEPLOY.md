# Deploying to Vercel with Supabase

The build applies database migrations itself (`scripts/migrate.mjs`, run by `npm run build`), so a new
environment needs only a Supabase database connected to the Vercel project. No email is ever sent:
members sign up and sign in with their mobile number and a password.

## 1. Create the database (Vercel → Storage)

Vercel project **goodlife-app** → **Storage** → **Create Database** → **Supabase** → connect it to the
project for Production (and Preview if you want preview builds to work). The integration adds
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
`POSTGRES_URL_NON_POOLING`.

## 2. Supabase settings

Supabase dashboard → Authentication → Sign In / Providers:

- **Email**: enabled (the app keeps a mail-less login behind each mobile number).
- **Allow new users to sign up**: off. The app creates accounts itself on the server.

## 3. Deploy, sign up, become admin

1. Deploy. The build log shows `[migrate] …` lines; on a fresh database it also creates
   «الدفعة الأولى» / «المجموعة الأولى», the group new sign-ups join.
2. Open the app → «أنشئ حسابًا» → name, mobile, password.
3. Vercel → Settings → Environment Variables → `BOOTSTRAP_ADMIN_PHONE` = that mobile (Production),
   then redeploy. The log shows `[migrate] +9665… is now admin.` You can remove the variable afterwards.

## Running the program

- **Which group new members join**: admin → the cohort → «اجعلها مجموعة التسجيل» on a group. Without a
  choice, it is the first open group of the newest cohort. Closing a group stops sign-ups to it.
- **Forgotten passwords**: admin home → «إعادة تعيين كلمة المرور» (mobile + new password), then tell the
  member.
- **Facilitators, admins, adding someone to a group**: by mobile number.

## Notes

- Demo people and cohorts (`supabase/seed.sql`) are local only; production gets `supabase/content.sql`.
  Seed accounts sign in with 0500000001…0500000004 and the password `goodlife123`.
- Anyone with the app link can sign up; each mobile number registers only once.
