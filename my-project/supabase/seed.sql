-- Local/dev seed (quickstart.md). Applied by `supabase db reset` after migrations.
-- Runs as the database owner, so RLS does not apply. One transaction, because users.active_role
-- is checked against user_roles at commit.
begin;

-- ── Accounts ────────────────────────────────────────────────────────────────
-- Sign in with the email; the 6-digit code arrives in the local mail viewer.
with seed_users(id, email) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'admin@example.test'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'facilitator@example.test'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'member1@example.test'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'member2@example.test')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
  email_change_token_new, email_change, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '',
       now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', now(), now()
from seed_users;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users where email like '%@example.test';

insert into public.users (id, full_name, email, time_zone, active_role) values
  ('00000000-0000-4000-8000-000000000001', 'مدير البرنامج', 'admin@example.test', 'Asia/Riyadh', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'سارة الميسّرة', 'facilitator@example.test', 'Asia/Riyadh', 'facilitator'),
  ('00000000-0000-4000-8000-000000000003', 'أحمد المشارك', 'member1@example.test', 'Asia/Riyadh', 'member'),
  ('00000000-0000-4000-8000-000000000004', 'مريم المشاركة', 'member2@example.test', 'Asia/Riyadh', 'member');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000001', 'member'),
  ('00000000-0000-4000-8000-000000000002', 'facilitator'),
  ('00000000-0000-4000-8000-000000000002', 'member'),
  ('00000000-0000-4000-8000-000000000003', 'member'),
  ('00000000-0000-4000-8000-000000000004', 'member');

-- ── Program structure ───────────────────────────────────────────────────────
-- Cohort started 11 days ago, so today is journey day 12.
insert into public.cohorts (id, name, start_date) values
  ('00000000-0000-4000-8000-0000000000c1', 'الدفعة التجريبية', current_date - 11);

insert into public.groups (id, cohort_id, name) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c1', 'مجموعة النور'),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000c1', 'مجموعة الأمل');

insert into public.group_memberships (group_id, user_id, role, started_on) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000002', 'facilitator', current_date - 11),
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000003', 'member', current_date - 11),
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000004', 'member', current_date - 11);

commit;
