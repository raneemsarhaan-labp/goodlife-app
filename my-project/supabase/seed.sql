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

-- ── US6: encouragement phrases ──────────────────────────────────────────────
insert into public.encouragement_phrases (text, sort_order) values
  ('بارك الله في سعيك', 1),
  ('ثبّتك الله', 2),
  ('خطوتك اليوم تُلهمني', 3),
  ('مستمر؟ أنا معك', 4),
  ('أحسنت، واصل بهدوء', 5);

-- ── US7: journey stages, the ten guidelines (editable placeholders), sample resources ─
insert into public.journey_stages (title, description, from_day, to_day, sort_order) values
  ('البداية والنيّة', 'تعرّف على نفسك ورحلتك، واكتب واقعك ونيّتك للعام.', 1, 30, 1),
  ('بناء العادات', 'عادات صغيرة ثابتة في مجالاتك المختارة.', 31, 120, 2),
  ('الثبات', 'المحافظة على ما بنيت، والتعامل مع الفتور.', 121, 210, 3),
  ('التعمّق', 'من العادة إلى المعنى: لماذا تفعل ما تفعل.', 211, 300, 4),
  ('الحصاد والانطلاق', 'مراجعة العام، وما تحمله معك بعده.', 301, 365, 5);

insert into public.guidelines (number, text) values
  (1, 'النيّة أولًا: نبدأ كل يوم بنيّة واضحة.'),
  (2, 'القليل الدائم خير من الكثير المنقطع.'),
  (3, 'الصدق مع النفس في التسجيل والمراجعة.'),
  (4, 'لا مقارنة: كلٌّ يسير في رحلته بقدره.'),
  (5, 'نحفظ أسرار المجموعة وما يُقال فيها.'),
  (6, 'نشجّع ولا نحكم.'),
  (7, 'نحضر اللقاءات ونحترم أوقاتها.'),
  (8, 'نعود بهدوء إذا انقطعنا، دون لوم.'),
  (9, 'نطلب العون حين نحتاجه.'),
  (10, 'نشكر الله على كل خطوة.');

insert into public.resources (type, title, description, category, url, audience, sort_order) values
  ('reference', 'كتاب مقترح: العادات الذرية', 'عن بناء العادات الصغيرة.', 'كتب', 'https://example.org/atomic-habits', 'program', 1),
  ('reference', 'مقالة: كيف نراجع شهرنا', 'أفكار لمراجعة شهرية هادئة.', 'مقالات', 'https://example.org/monthly-review', 'program', 2);

-- ── Spec 002: daily quotes and habit icons ────────────────────────────────────
insert into public.quotes (text, source, sort_order) values
  ('الحياة الطيّبة: رحلةُ سعيٍ حثيث، لمقصدٍ معتبَر، بوعيٍ ناقدٍ مستبصر، ونفسٍ توّاقةٍ مطمئنّة، وقلبٍ سليم.', null, 1),
  ('قليلٌ دائم خيرٌ من كثيرٍ منقطع.', null, 2),
  ('ابدأ صغيرًا، واثبت طويلًا.', null, 3),
  ('النيّة الصادقة تجعل العادة عبادة.', null, 4),
  ('كل يومٍ صفحةٌ جديدة، فاكتبها بهدوء.', null, 5),
  ('ليس المطلوب أن تكمل كل شيء، بل أن تستمر.', null, 6),
  ('من عرف وجهته هانت عليه الطريق.', null, 7),
  ('الطمأنينة ثمرة الخطوات الصغيرة المتكررة.', null, 8),
  ('أحسن إلى نفسك كما تحسن إلى غيرك.', null, 9),
  ('ما تفعله كل يوم أهم مما تفعله أحيانًا.', null, 10),
  ('الرفيق قبل الطريق، فاختر من يعينك.', null, 11),
  ('اشكر على القليل يُبارَك لك فيه.', null, 12);

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
insert into public.habit_library (domain_id, name, amount, hint, icon, sort_order) values
  ((select id from public.life_domains where key = 'faith'), 'أذكار الصباح', '٥ دقائق', 'بعد الفجر، قبل أن يبدأ الزحام', 'wb_sunny', 1),
  ((select id from public.life_domains where key = 'faith'), 'وردي من القرآن', 'نصف صفحة', 'صفحاتٌ معلومةٌ لا تُترك', 'menu_book', 2),
  ((select id from public.life_domains where key = 'faith'), 'اقرأ صفحةً وقف عند آية', null, 'اسأل نفسك: ما الذي لو عملتُ به اليوم؟', 'auto_stories', 3),
  ((select id from public.life_domains where key = 'faith'), 'صلاة الضحى', 'ركعتان', 'ركعتان خفيفتان', 'mosque', 4),
  ((select id from public.life_domains where key = 'faith'), 'قيام ركعتين', 'ركعتان', 'ولو ركعتين قبل النوم', 'nightlight', 5),
  ((select id from public.life_domains where key = 'faith'), 'الاستغفار', '٢٠ مرّة', 'موزَّعًا لا مجموعًا', 'favorite', 6),
  ((select id from public.life_domains where key = 'faith'), 'دعاء قبل النوم', null, 'خاتمة هادئة ليومك', 'bedtime', 7),
  ((select id from public.life_domains where key = 'faith'), 'ترك الغِيبة', null, 'أن أصمت حيث كنتُ أتكلّم', 'block', 8),
  ((select id from public.life_domains where key = 'self'), 'مشي', '٢٠ دقيقة', 'في الهواء الطلق لا على جهاز', 'directions_walk', 1),
  ((select id from public.life_domains where key = 'self'), 'النوم قبل الحادية عشرة', null, 'والهاتف خارج الغرفة', 'bedtime', 2),
  ((select id from public.life_domains where key = 'self'), 'جلسة صمت', '٥ دقائق', 'بلا شاشة ولا صوت', 'self_improvement', 3),
  ((select id from public.life_domains where key = 'self'), 'شرب الماء بانتظام', '٨ أكواب', 'موزّعة على اليوم', 'water_drop', 4),
  ((select id from public.life_domains where key = 'self'), 'ترك السكّر المضاف', null, 'خطوة صغيرة للجسد', 'no_food', 5),
  ((select id from public.life_domains where key = 'self'), 'ترك التصفّح العشوائي', null, 'أضع حدًّا للوقت', 'phone_disabled', 6),
  ((select id from public.life_domains where key = 'family'), 'اتصال بأحد الوالدين', null, 'ولو دقائق', 'favorite', 1),
  ((select id from public.life_domains where key = 'family'), 'وقت هادئ مع العائلة', null, 'بلا شاشات', 'family_restroom', 2),
  ((select id from public.life_domains where key = 'family'), 'رسالة شكر لصديق', null, 'صِلة صغيرة تدوم', 'edit_note', 3),
  ((select id from public.life_domains where key = 'family'), 'لقاء صديق', null, 'وجهًا لوجه لا رسالةً', 'family_restroom', 4),
  ((select id from public.life_domains where key = 'work'), 'عمل عميق', '١٥ دقيقة', 'بلا إشعارات ولا مقاطعة', 'work', 1),
  ((select id from public.life_domains where key = 'work'), 'ترتيب مهامّ الغد', '٣ مهامّ', 'قبل أن أُغلق يومي', 'edit_note', 2),
  ((select id from public.life_domains where key = 'work'), 'مراجعة المصروف', null, 'في آخر اليوم', 'schedule', 3),
  ((select id from public.life_domains where key = 'work'), 'صدقة من الرزق', null, 'ولو قليلة', 'volunteer_activism', 4),
  ((select id from public.life_domains where key = 'work'), 'ترك تصفّح العمل ليلًا', null, 'بعد التاسعة أُغلق', 'phone_disabled', 5),
  ((select id from public.life_domains where key = 'learning'), 'قراءة', '١٥ دقيقة', 'كتاب غير الشاشة', 'menu_book', 1),
  ((select id from public.life_domains where key = 'learning'), 'تعلّم فكرة جديدة', null, 'ودوّنها', 'school', 2),
  ((select id from public.life_domains where key = 'giving'), 'مساعدة شخص اليوم', null, 'ولو بكلمة طيّبة', 'volunteer_activism', 1),
  ((select id from public.life_domains where key = 'giving'), 'تطوّع صغير', null, 'حسب وقتك', 'favorite', 2);
update public.habits set domain_id = (select id from public.life_domains where key = 'learning') where id = '00000000-0000-4000-8000-000000000d01';
update public.habits set domain_id = (select id from public.life_domains where key = 'self') where id in ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000d03', '00000000-0000-4000-8000-000000000d04');

-- ── Spec 005: «مكتبة التحدّيات»; member1 «هويّتي», plan domains with texts, review due today ──
insert into public.challenge_library (domain_id, style, title, prompt, habit_name, sort_order) values
  ((select id from public.life_domains where key = 'faith'), 'action', 'اقرأ صفحةً واحدةً وقف عند آية', 'اسأل نفسك: لو عملتَ بها اليوم، ما الذي كان سيتغيّر؟', 'اقرأ صفحةً وقف عند آية', 1),
  ((select id from public.life_domains where key = 'faith'), 'reflection', 'تأمّل نعمةً واحدةً قبل النوم', 'سمِّها، واشكر عليها بكلمة.', 'شكر نعمة قبل النوم', 2),
  ((select id from public.life_domains where key = 'faith'), 'action', 'أدِّ صلاةً في أول وقتها اليوم', 'لاحظ كيف يتغيّر يومك حولها.', null, 3),
  ((select id from public.life_domains where key = 'self'), 'action', 'اشرب كوب ماء قبل أي مشروب آخر اليوم', 'خطوة صغيرة، تصنع فرقًا في جسدك', 'اشرب كوب ماء أولًا', 4),
  ((select id from public.life_domains where key = 'self'), 'action', 'امشِ عشر دقائق بلا هاتف', 'انتبه لما حولك.', 'مشي بلا هاتف', 5),
  ((select id from public.life_domains where key = 'self'), 'reflection', 'ما الذي أتعبك اليوم أكثر مما يستحق؟', 'اكتب سطرًا واحدًا.', null, 6),
  ((select id from public.life_domains where key = 'family'), 'action', 'اتصل بشخص لم تسأل عنه منذ زمن', 'صِلة صغيرة قد تُسعد يومكما', 'اتصل بشخص غفلت عنه', 7),
  ((select id from public.life_domains where key = 'family'), 'action', 'اجلس مع أهلك عشر دقائق بلا شاشات', 'استمع أكثر مما تتكلّم.', 'وقت هادئ مع العائلة', 8),
  ((select id from public.life_domains where key = 'work'), 'action', 'أنجز أصعب مهمّة قبل الظهر', 'ابدأ بها قبل البريد.', 'عمل عميق صباحًا', 9),
  ((select id from public.life_domains where key = 'work'), 'reflection', 'ما العمل الذي يقرّبك من رزقٍ أطيب؟', 'فكّرة واحدة تكفي.', null, 10),
  ((select id from public.life_domains where key = 'learning'), 'action', 'اقرأ عشر صفحات من كتاب نافع', 'ودوّن فكرة واحدة.', 'قراءة ١٠ صفحات', 11),
  ((select id from public.life_domains where key = 'learning'), 'reflection', 'ما الفكرة التي تعلّمتها هذا الأسبوع؟', 'كيف ستعمل بها؟', null, 12),
  ((select id from public.life_domains where key = 'giving'), 'action', 'ساعد شخصًا دون أن يطلب', 'ولو بكلمة طيّبة.', 'مساعدة شخص اليوم', 13),
  ((select id from public.life_domains where key = 'leisure'), 'action', 'خذ عشرين دقيقة لما تحبّ', 'بلا شعور بالذنب.', 'وقت لما أحب', 14);
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
