import type { CommunityItem } from "@/components/features/community/ActivityList";
import type { CommunityGroup } from "@/components/features/community/CommunityView";
import type { MemberInsights, MemberStats } from "@/server/queries/stats";
import type { GroupChallenge, Together } from "@/server/queries/together";

/** Sample data for the «أثرك»، «المجتمع» and «المزيد» previews (design comparison). Not used by the app. */
export const SAMPLE_HEADER = { name: "سلمان العتيبي", timeZone: "Asia/Riyadh", localDate: "2026-11-27", journeyDay: 16 };
export const SAMPLE_TODAY_DATE = "2026-11-27";

const day = (i: number) => `2026-11-${String(21 + i).padStart(2, "0")}`;

export const SAMPLE_STATS: MemberStats = {
  from: "2026-11-21",
  to: "2026-11-27",
  days: 7,
  habits: [
    { habit_id: "00000000-0000-4000-8000-00000000a001", name: "أذكار الصباح", done_days: 6, possible_days: 7, archived: false, current_streak: 21, longest_streak: 21 },
    { habit_id: "00000000-0000-4000-8000-00000000a002", name: "وردي من القرآن", done_days: 4, possible_days: 7, archived: false, current_streak: 12, longest_streak: 14 },
    { habit_id: "00000000-0000-4000-8000-00000000a003", name: "مشي", done_days: 2, possible_days: 6, archived: false, current_streak: 4, longest_streak: 9, grace_this_week: true },
    { habit_id: "00000000-0000-4000-8000-00000000a004", name: "قراءة قبل النوم", done_days: 2, possible_days: 7, archived: false, current_streak: 5, longest_streak: 5 },
  ],
  habits_done: 26,
  habits_possible: 35,
  journey_total: 12,
  journey_done: 7,
  own_written: 3,
  own_done: 2,
  days_closed: 5,
};

export const SAMPLE_ICONS: Record<string, string> = {
  "00000000-0000-4000-8000-00000000a001": "wb_sunny",
  "00000000-0000-4000-8000-00000000a002": "menu_book",
  "00000000-0000-4000-8000-00000000a003": "directions_walk",
  "00000000-0000-4000-8000-00000000a004": "bedtime",
};

const rates = [1, 0.4, 1, 0.2, 1, 0.9, 0];
export const SAMPLE_INSIGHTS: MemberInsights = {
  from: "2026-11-21",
  to: "2026-11-27",
  consecutive_days: 12,
  active_habits: 7,
  plan_vs_other: { plan_done: 23, plan_possible: 28, other_done: 7, other_possible: 13 },
  buckets: rates.map((r, i) => ({ from: day(i), to: day(i), done: Math.round(r * 10), possible: 10 })),
  domains: [
    { id: "1", name: "الصلة بالله", icon: "auto_stories", color: "sage", habits: 2, done: 13, possible: 14 },
    { id: "2", name: "النفس والبدن", icon: "psychology", color: "gold", habits: 4, done: 19, possible: 28 },
    { id: "3", name: "العلاقات القريبة", icon: "favorite", color: "dawn", habits: 0, done: 0, possible: 0 },
    { id: "4", name: "العمل والرزق", icon: "work", color: "ink", habits: 0, done: 0, possible: 0 },
    { id: "5", name: "العلم والتعلّم", icon: "school", color: "violet", habits: 1, done: 5, possible: 7 },
    { id: "6", name: "الإسهام والنفع", icon: "volunteer_activism", color: "sage", habits: 0, done: 0, possible: 0 },
    { id: "7", name: "الترويح", icon: "spa", color: "dawn", habits: 0, done: 0, possible: 0 },
  ],
};

/** Month and «سنة» buckets for ?period=month / journey. */
export const SAMPLE_BUCKETS = {
  month: [
    { from: "2026-11-01", to: "2026-11-07", done: 10, possible: 10 },
    { from: "2026-11-08", to: "2026-11-14", done: 13, possible: 20 },
    { from: "2026-11-15", to: "2026-11-21", done: 20, possible: 20 },
    { from: "2026-11-22", to: "2026-11-28", done: 7, possible: 20 },
  ],
  journey: [
    { from: "2026-01-01", to: "2026-01-31", done: 2, possible: 10 },
    { from: "2026-02-01", to: "2026-02-28", done: 9, possible: 20 },
    { from: "2026-03-01", to: "2026-03-31", done: 12, possible: 20 },
    { from: "2026-04-01", to: "2026-04-30", done: 16, possible: 20 },
    { from: "2026-05-01", to: "2026-05-31", done: 20, possible: 20 },
    { from: "2026-06-01", to: "2026-06-30", done: 11, possible: 20 },
    { from: "2026-07-01", to: "2026-07-31", done: 14, possible: 20 },
    { from: "2026-11-01", to: "2026-11-30", done: 18, possible: 20 },
  ],
};

const item = (user_id: string, name: string, habit: string, done: boolean, together = 2, me = false) => ({ user_id, name, habit, done, together, me });
export const SAMPLE_TOGETHER: Together = {
  group: { id: "g", name: "الدفعة الثالثة", cohort: "الدفعة الثالثة", start_date: "2026-11-12", members: 5 },
  sharing: true,
  items: [
    item("me", "أنت", "أذكار الصباح", false, 2, true),
    item("me", "أنت", "قراءة قبل النوم", false, 2, true),
    item("a", "أيمن", "وردي من القرآن", true),
    item("a", "أيمن", "مشي", true),
    item("s", "سارة", "أذكار الصباح", true),
    item("s", "سارة", "جلسة بلا هاتف مع الأسرة", false),
    item("m", "محمود", "مشي", false),
    item("h", "هدى", "قراءة قبل النوم", true),
    item("h", "هدى", "شرب الماء", true),
    item("h", "هدى", "وردي من القرآن", true),
  ],
};

export const SAMPLE_CHALLENGES: GroupChallenge[] = [
  { id: "a", title: "أسبوع الصلة", description: "سبعة أيام، عادةٌ واحدة يلتزم بها الجميع بالمقدار نفسه", habit_name: "وردي من القرآن", amount: "صفحة", days: 127, starts_on: "2026-11-21", duration_days: 7, domain: null, status: "active", day: 6, joined: true, kept: 4, possible: 6, group_joined: 5, group_done_today: 3 },
  { id: "b", title: "شهر بلا تصفّح بعد العاشرة", description: null, habit_name: "ترك التصفّح بعد العاشرة", amount: null, days: 127, starts_on: "2026-12-03", duration_days: 30, domain: null, status: "upcoming", day: 0, joined: false, kept: 0, possible: 0, group_joined: 0, group_done_today: 0 },
];

const base = { description: null, location: null, session_count: 1, registration_open: false, registered: false, places_left: null, window_open: true, is_new: false, presenter: null };
export const SAMPLE_ACTIVITIES: CommunityItem[] = [
  { ...base, id: "00000000-0000-4000-8000-0000000000e1", title: "محاضرة: النموذج المعرفي وأثره في الطمأنينة", description: "مدخلٌ إلى النموذج المعرفي كما تقرؤه في الرحلة، وأثره العمليّ في سكون النفس. مفتوحة للجميع ولا تحتاج حضورًا سابقًا.", mode: "in_person", next_starts_at: "2026-12-01T17:00:00Z", registration_open: true, places_left: 17, is_new: true, presenter: "د. أيمن", location: "مركز الرحلة · الدور الثاني، القاعة الكبرى" },
  { ...base, id: "00000000-0000-4000-8000-0000000000e2", title: "نشاط قراءة: أمراض القلوب — أربعة لقاءات", description: "نقرأ معًا فصلًا كل أسبوع ونتدارسه. يُشترط الالتزام باللقاءات الأربعة.", mode: "online", next_starts_at: "2026-12-05T16:00:00Z", session_count: 4, registration_open: true, registered: true, places_left: 12, presenter: "فريق الرحلة" },
  { ...base, id: "00000000-0000-4000-8000-0000000000e3", title: "لقاء الدفعة الثالثة — بعد شهر من الجلسة", description: "وقفةٌ مع من ساروا معك: كيف مضى الشهر الأول، وما الذي تعثّر، وما الذي ثبت.", mode: "in_person", next_starts_at: "2026-12-11T15:00:00Z", registration_open: true, places_left: 9, presenter: "د. أيمن", location: "مركز الرحلة · الدور الثاني، القاعة الكبرى" },
];

export const SAMPLE_GROUP: CommunityGroup = {
  groupName: "مجموعة النور",
  cohortName: "الدفعة الثالثة",
  facilitators: [{ user_id: "f", full_name: "سارة الميسّرة", role: "facilitator", group_id: "g" }],
  members: [
    { user_id: "m1", full_name: "مريم المشاركة", role: "member", group_id: "g" },
    { user_id: "m2", full_name: "أحمد المشارك", role: "member", group_id: "g" },
  ],
  phrases: [{ id: "p1", text: "بارك الله في سعيك" }],
  encouragedToday: new Set(["m2"]),
};

export const SAMPLE_RECEIVED = [{ id: "r1", sender_name: "أحمد المشارك", phrase: "بارك الله في سعيك", local_date: "2026-11-26" }];

export const SAMPLE_GUIDELINES = [
  "التساؤلات الأعمق قبل الإجابات الجاهزة",
  "ثِقْ بالرحلة وابقَ مع عدم اليقين",
  "التقشير يحتاج وقتًا فاصبر على الطبقات",
  "نصنع المنهج معًا فالجماعة هي المعلّم الأكبر",
  "قدِّر التعلّم المصغّر وقوة الحضور بالقلب",
  "كل النماذج خاطئة نسبيًا ولكن بعضها نافع",
  "الممارسة هي الطريق كله فالمعرفة مجرّدها لن تصلك",
  "لا مكان للشعور بالذنب فقط عُد إلى الإيقاع",
  "مساحة آمنة للمشاركة وليست للحكم أو النصح",
  "نحن في دوائر لا مراتب فدعونا نلتقي حيث نحن",
].map((text, i) => ({ number: i + 1, text }));
