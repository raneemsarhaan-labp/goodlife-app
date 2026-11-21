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

insert into public.journey_challenges (journey_day, text) values
  (1, 'اكتب في سطرين: لماذا بدأت هذه الرحلة؟'),
  (2, 'اشرب كوب ماء قبل أن تمسك هاتفك صباحًا.'),
  (3, 'اتصل بشخص تحبه دون سبب، فقط لتسأل عنه.'),
  (4, 'امشِ عشر دقائق دون سماعات، وانتبه لما حولك.'),
  (5, 'رتّب مكانًا صغيرًا واحدًا في بيتك.'),
  (6, 'اكتب ثلاثة أشياء تشعر بالامتنان لها اليوم.'),
  (7, 'خصّص نصف ساعة بلا شاشات قبل النوم.'),
  (8, 'اسأل أحد أفراد أسرتك عن يومه واستمع دون مقاطعة.'),
  (9, 'تناول وجبة واحدة اليوم بهدوء ودون استعجال.'),
  (10, 'سامح موقفًا صغيرًا ما زال عالقًا في نفسك.'),
  (11, 'اقرأ صفحة من كتاب تؤجّله منذ مدة.'),
  (12, 'قدّم معروفًا صغيرًا لشخص لا يتوقعه.'),
  (13, 'دوّن عادة واحدة تريد أن تتخفف منها، ولماذا.'),
  (14, 'اجلس خمس دقائق في مكان هادئ وتنفّس ببطء.'),
  (15, 'راجع أسبوعك: ما الذي أعطاك طاقة؟ وما الذي أخذها؟'),
  (16, 'أرسل رسالة شكر لشخص أثّر فيك.'),
  (17, 'نم مبكرًا ثلاثين دقيقة عن عادتك.'),
  (18, 'أنجز مهمة صغيرة كنت تؤجلها.'),
  (19, 'تحدّث مع أحد أفراد مجموعتك عن تجربته في الرحلة.'),
  (20, 'اقضِ وقتًا في الطبيعة ولو قليلًا.'),
  (21, 'اكتب رسالة قصيرة لنفسك بعد عام من الآن.'),
  (22, 'قلّل اليوم من شيء واحد يشتّت انتباهك.'),
  (23, 'ساعد أحدًا في بيتك في عمل يقوم به عادةً وحده.'),
  (24, 'اختر كلمة طيبة وقلها لثلاثة أشخاص اليوم.'),
  (25, 'راجع خطتك: هل ما زالت مجالاتك هي ما يهمك فعلًا؟'),
  (26, 'تعلّم شيئًا صغيرًا جديدًا في عشر دقائق.'),
  (27, 'اجعل وجبة اليوم وقتًا مشتركًا مع من تحب.'),
  (28, 'تخلّص من شيء لم تعد تحتاجه.'),
  (29, 'اكتب ما تعلّمته عن نفسك هذا الشهر.'),
  (30, 'احتفِ بتقدّمك الصغير، وشارك مجموعتك كلمة تشجيع.');

insert into public.closing_messages (text) values
  ('ما نويته اليوم تمّ. وغدًا يبدأ من حيث توقفت.'),
  ('يومٌ آخر في الرحلة. ما فعلته يكفي، والباقي يأتي بهدوء.'),
  ('خطوة صغيرة اليوم، وأثرٌ يتراكم مع الأيام.'),
  ('أحسنت الختام. استرح جيدًا، فالغد بداية جديدة.'),
  ('ليس المطلوب أن يكتمل كل شيء، بل أن تستمر.'),
  ('شكرًا لأنك وقفت مع نفسك اليوم.');

insert into public.activities (id, title, description, starts_at, location, created_by) values
  ('00000000-0000-4000-8000-0000000000e1', 'لقاء الدفعة الشهري', 'لقاء عام لجميع مجموعات الدفعة: وقفة مع الشهر الأول.',
   date_trunc('day', now()) + interval '3 days' + interval '17 hours', 'عبر الاتصال المرئي', '00000000-0000-4000-8000-000000000001');
insert into public.activity_audiences (activity_id, cohort_id) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1');

-- ── US4: monthly review questions ───────────────────────────────────────────
insert into public.review_questions (text, sort_order) values
  ('ما الذي تقدّمت فيه هذا الشهر، ولو قليلًا؟', 1),
  ('ما الذي أعانك على الالتزام؟', 2),
  ('ما الذي أعاقك، وكيف تتعامل معه الشهر القادم؟', 3),
  ('هل تريد تعديل شيء في خطتك أو عاداتك؟', 4),
  ('كلمة تقولها لنفسك وأنت تبدأ الشهر القادم.', 5);

commit;
