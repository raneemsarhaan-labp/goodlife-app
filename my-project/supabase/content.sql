-- Starter content for every environment (local, CI, production): journey challenges, closing
-- messages, review questions, encouragement phrases, journey stages, the ten guidelines, daily quotes,
-- «مكتبة العادات» and «مكتبة التحدّيات». No people, cohorts or personal data — those are in seed.sql
-- (local demo only). Applied once in production by scripts/migrate.mjs; admins edit it in the app.

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

insert into public.review_questions (text, sort_order) values
  ('ما الذي تقدّمت فيه هذا الشهر، ولو قليلًا؟', 1),
  ('ما الذي أعانك على الالتزام؟', 2),
  ('ما الذي أعاقك، وكيف تتعامل معه الشهر القادم؟', 3),
  ('هل تريد تعديل شيء في خطتك أو عاداتك؟', 4),
  ('كلمة تقولها لنفسك وأنت تبدأ الشهر القادم.', 5);

insert into public.encouragement_phrases (text, sort_order) values
  ('بارك الله في سعيك', 1),
  ('ثبّتك الله', 2),
  ('خطوتك اليوم تُلهمني', 3),
  ('مستمر؟ أنا معك', 4),
  ('أحسنت، واصل بهدوء', 5);

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
