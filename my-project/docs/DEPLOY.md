# Deploying to Vercel with Supabase

The build applies database migrations itself (`scripts/migrate.mjs`, run by `npm run build`), so a new
environment needs a Supabase database connected to the Vercel project and an email sender. Members
sign up with name, email and mobile and confirm with a 6-digit code sent to the email; they sign in
with their email or mobile and a new code each time (a password also works for accounts that have one).

## 1. Create the database (Vercel → Storage)

Vercel project **goodlife-app** → **Storage** → **Create Database** → **Supabase** → connect it to the
project for Production (and Preview if you want preview builds to work). The integration adds
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
`POSTGRES_URL_NON_POOLING`.

## 2. Supabase settings

Supabase dashboard → Authentication:

- **Sign In / Providers → Email**: enabled; **Confirm email** on; OTP length 6. **Allow new users to
  sign up**: off (the app creates accounts itself on the server).
- **Emails → Confirm signup** template (sign-up code): subject «رمز تأكيد بريدك في «الحياة الطيبة»»,
  body `supabase/templates/confirm-signup-code.html`.
- **Emails → Magic Link** template (sign-in code): subject «رمز الدخول إلى «الحياة الطيبة»», body
  `supabase/templates/sign-in-code.html`. Both show `{{ .Token }}`, the 6-digit code.
- **Emails → SMTP Settings**: custom SMTP. Supabase's built-in sender only reaches your own team's
  addresses, a few per hour. Without a domain, Gmail works: host `smtp.gmail.com`, port 465, user =
  your Gmail address, password = a Google *app password* (Google account → Security → 2-Step
  Verification → App passwords). Then raise Authentication → Rate Limits → emails per hour.
- **URL Configuration**: Site URL = the production address; add `https://<that address>/**` to
  Redirect URLs (used if the email carries a link instead of the code).

## 3. Deploy, sign up, become admin

1. Deploy. The build log shows `[migrate] …` lines; on a fresh database it also creates
   «الدفعة الأولى» / «المجموعة الأولى», the group new sign-ups join.
2. Open the app → «أنشئ حسابًا» → name, email, mobile → the code from the email.
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
- Anyone with the app link can sign up; each email and each mobile number registers only once.
- Owner mobiles in `owner_phones` (migration 0023, stored as SHA-256) become admin on sign-up.
