-- Local/dev seed (quickstart.md). Applied by `supabase db reset` after migrations.
-- Runs as the database owner, so RLS does not apply. One transaction, because users.active_role
-- is checked against user_roles at commit.
begin;

-- ── Accounts ────────────────────────────────────────────────────────────────
-- Sign in with the mobile number and the password goodlife123.
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
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
       extensions.crypt('goodlife123', extensions.gen_salt('bf')),
       now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', now(), now()
from seed_users;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users where email like '%@example.test';

insert into public.users (id, full_name, email, phone, time_zone, active_role) values
  ('00000000-0000-4000-8000-000000000001', 'مدير البرنامج', 'admin@example.test', '+966500000001', 'Asia/Riyadh', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'سارة الميسّرة', 'facilitator@example.test', '+966500000002', 'Asia/Riyadh', 'facilitator'),
  ('00000000-0000-4000-8000-000000000003', 'أحمد المشارك', 'member1@example.test', '+966500000003', 'Asia/Riyadh', 'member'),
  ('00000000-0000-4000-8000-000000000004', 'مريم المشاركة', 'member2@example.test', '+966500000004', 'Asia/Riyadh', 'member');

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

insert into public.groups (id, cohort_id, name, is_default) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c1', 'مجموعة النور', true),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000c1', 'مجموعة الأمل', false);

insert into public.group_memberships (group_id, user_id, role, started_on) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000002', 'facilitator', current_date - 11),
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000003', 'member', current_date - 11),
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000004', 'member', current_date - 11);

-- ── US1: invitations, plans, habits, challenges, closing messages, activity ─
set local goodlife.seeding = 'on'; -- allow back-dated history in seed only

-- Join with this code (quickstart.md). Alphabet excludes 0/O/1/I/L.
insert into public.invitation_codes (code, cohort_id, group_id, expires_at, max_uses, created_by) values
  ('TAYBAH26', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1',
   now() + interval '90 days', 50, '00000000-0000-4000-8000-000000000001');

insert into public.plans (id, user_id, cohort_id, current_state) values
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000c1',
   'أبدأ هذه الرحلة وأنا أريد يومًا أهدأ، ونومًا أبكر، ووقتًا أكثر مع أهلي.'),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000c1', '');

insert into public.habits (id, plan_id, name, sort_order) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-0000000000b3', 'قراءة عشر صفحات', 1),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-0000000000b3', 'مشي عشرين دقيقة', 2),
  ('00000000-0000-4000-8000-000000000d03', '00000000-0000-4000-8000-0000000000b3', 'النوم قبل الحادية عشرة', 3),
  ('00000000-0000-4000-8000-000000000d04', '00000000-0000-4000-8000-0000000000b3', 'دقائق من الهدوء والتأمل', 4);

-- Ten days of history for member1 (some days done, some not), for stats and reviews.
insert into public.habit_completions (habit_id, user_id, local_date, client_mutation_id)
select h.id, '00000000-0000-4000-8000-000000000003', current_date - d, gen_random_uuid()
from public.habits h, generate_series(1, 10) d
where h.plan_id = '00000000-0000-4000-8000-0000000000b3' and (d + h.sort_order) % 3 <> 0;



insert into public.activities (id, title, description, starts_at, location, created_by) values
  ('00000000-0000-4000-8000-0000000000e1', 'لقاء الدفعة الشهري', 'لقاء عام لجميع مجموعات الدفعة: وقفة مع الشهر الأول.',
   date_trunc('day', now()) + interval '3 days' + interval '17 hours', 'عبر الاتصال المرئي', '00000000-0000-4000-8000-000000000001');
insert into public.activity_audiences (activity_id, cohort_id) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- ── US4: monthly review questions ───────────────────────────────────────────

-- ── US6: encouragement phrases ──────────────────────────────────────────────

-- ── US7: journey stages, the ten guidelines (editable placeholders), sample resources ─


insert into public.resources (type, title, description, category, url, audience, sort_order) values
  ('reference', 'كتاب مقترح: العادات الذرية', 'عن بناء العادات الصغيرة.', 'كتب', 'https://example.org/atomic-habits', 'program', 1),
  ('reference', 'مقالة: كيف نراجع شهرنا', 'أفكار لمراجعة شهرية هادئة.', 'مقالات', 'https://example.org/monthly-review', 'program', 2);

-- ── Spec 002: daily quotes and habit icons ────────────────────────────────────

update public.habits set icon = 'menu_book' where id = '00000000-0000-4000-8000-000000000d01';
update public.habits set icon = 'directions_walk' where id = '00000000-0000-4000-8000-000000000d02';
update public.habits set icon = 'bedtime' where id = '00000000-0000-4000-8000-000000000d03';
update public.habits set icon = 'self_improvement' where id = '00000000-0000-4000-8000-000000000d04';

-- ── Spec 003: «حالي المنشود» for member1; a registration-open online reading circle ──
update public.plans set desired_state =
  'أستيقظ ولي وقتٌ لنفسي قبل أن يبدأ يومي مع الناس. أمشي بخُطًى ثابتة، وأُنجز ما نويت دون استعجالٍ أو ضغط، وأنام وأنا مطمئن أنّي عشتُ يومي كما أحب.'
where id = '00000000-0000-4000-8000-0000000000b3';

insert into public.activities (id, title, description, starts_at, location, created_by, registration_open, capacity, mode) values
  ('00000000-0000-4000-8000-0000000000e2', 'نشاط قراءة: أمراض القلوب', 'أربعة لقاءات أسبوعية نقرأ فيها معًا ونتدارس.',
   date_trunc('day', now()) + interval '2 days' + interval '18 hours', null, '00000000-0000-4000-8000-000000000001', true, 2, 'online');
insert into public.activity_audiences (activity_id, group_id) values
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a1');
delete from public.activity_sessions where activity_id = '00000000-0000-4000-8000-0000000000e2';
insert into public.activity_sessions (activity_id, starts_at, ends_at)
  select '00000000-0000-4000-8000-0000000000e2',
         date_trunc('day', now()) + interval '2 days' + interval '18 hours' + i * interval '7 days',
         date_trunc('day', now()) + interval '2 days' + interval '19 hours' + i * interval '7 days'
  from generate_series(0, 3) i;
insert into public.activity_links (activity_id, meeting_url) values
  ('00000000-0000-4000-8000-0000000000e2', 'https://meet.example.test/qulub');

-- ── Spec 004: «مكتبة العادات» (from the designs) and habit domains for member1 ──
update public.habits set domain_id = (select id from public.life_domains where key = 'learning') where id = '00000000-0000-4000-8000-000000000d01';
update public.habits set domain_id = (select id from public.life_domains where key = 'self') where id in ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000d03', '00000000-0000-4000-8000-000000000d04');

-- ── Spec 005: «مكتبة التحدّيات»; member1 «هويّتي», plan domains with texts, review due today ──
update public.plans set identity = 'أنا ساعٍ إلى حياةٍ أهدأ، أرعى أهلي وأطلب العلم، وأريد أن يكون لي وقتٌ مع الله كل يوم.',
  next_review_on = current_date
where id = '00000000-0000-4000-8000-0000000000b3';
insert into public.focus_areas (plan_id, title, description, sign, domain_id, sort_order) values
  ('00000000-0000-4000-8000-0000000000b3', 'الصلة بالله', 'أن يكون لي وِردٌ لا أتركه، ووقتٌ هادئ قبل الفجر.', 'أفتقد الوِرد إذا فاتني.',
   (select id from public.life_domains where key = 'faith'), 10),
  ('00000000-0000-4000-8000-0000000000b3', 'النفس والبدن', 'جسدٌ نشيط ونومٌ مبكر.', 'أستيقظ دون منبّه.',
   (select id from public.life_domains where key = 'self'), 11);

-- ── Spec 007: member1 shares two habits; member2 shares the same walk; a running group challenge ──
update public.habits set shared_with_group = true
where id in ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-000000000d02');
insert into public.habits (id, plan_id, name, sort_order, shared_with_group, domain_id) values
  ('00000000-0000-4000-8000-000000000d21', '00000000-0000-4000-8000-0000000000b4', 'مشي عشرين دقيقة', 1, true,
   (select id from public.life_domains where key = 'self'));
update public.activities set presenter = 'أ. سارة الأحمد' where id = '00000000-0000-4000-8000-0000000000e2';
insert into public.group_challenges (title, description, domain_id, habit_name, amount, starts_on, duration_days, cohort_id, created_by) values
  ('أسبوع الصلة', 'سبعة أيام نقرأ فيها وِردًا يوميًّا معًا.', (select id from public.life_domains where key = 'faith'),
   'وردي من القرآن', 'صفحة', current_date - 5, 7, '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001'),
  ('شهر الحركة', 'ثلاثون يومًا من المشي.', (select id from public.life_domains where key = 'self'),
   'مشي ١٥ دقيقة', '١٥ دقيقة', current_date + 7, 30, '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001');

commit;
