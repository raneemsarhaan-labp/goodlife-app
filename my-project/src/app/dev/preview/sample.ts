import type { TodayData } from "@/server/queries/today";

/** Sample data for development-only previews (gallery screenshots). Not used by the app. */
const week = (doneIdx: number[], off: number[] = []) =>
  ["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"].map((date, i) => ({
    date,
    scheduled: !off.includes(i),
    done: doneIdx.includes(i),
  }));

export const SAMPLE_TODAY: TodayData = {
  local_date: "2026-11-23",
  time_zone: "Asia/Riyadh",
  journey_status: "active",
  journey_day: 12,
  cohort: { id: "c", name: "الدفعة الثالثة", start_date: "2026-11-12", end_date: "2027-11-11" },
  habits: [
    { id: "00000000-0000-4000-8000-00000000a001", name: "أذكار الصباح", done: true, icon: "wb_sunny", time_of_day: "morning", amount: "٥ دقائق", description: "بعد الفجر، قبل أن يبدأ الزحام", week: week([0, 1, 2]), week_scheduled: 7, current_streak: 21 },
    { id: "00000000-0000-4000-8000-00000000a002", name: "وردي من القرآن", done: true, icon: "menu_book", time_of_day: "morning", amount: "صفحة", week: week([0, 1, 2]), week_scheduled: 7, current_streak: 12, challenge: { id: "x", title: "أسبوع الصلة", day: 6, days: 7 } },
    { id: "00000000-0000-4000-8000-00000000a003", name: "مشي", done: false, icon: "directions_walk", time_of_day: "evening", amount: "٢٠ دقيقة", week: week([0, 1], [5]), week_scheduled: 6, current_streak: 4 },
    { id: "00000000-0000-4000-8000-00000000a004", name: "النوم قبل الحادية عشرة", done: false, icon: "bedtime", time_of_day: "evening", week: week([1]), week_scheduled: 7, current_streak: 1 },
    { id: "00000000-0000-4000-8000-00000000a005", name: "اتصال بأحد الوالدين", done: false, icon: "family_restroom", time_of_day: "any", week: week([0]), week_scheduled: 7, current_streak: 0 },
  ],
  habits_total: 5,
  journey_challenge: null,
  library_challenge: {
    id: "l",
    title: "اتصل بشخص لم تسأل عنه منذ زمن",
    prompt: "صِلة صغيرة قد تُسعد يومكما",
    style: "action",
    habit_name: "اتصل بشخص غفلت عنه",
    domain: { id: "d", name: "العلاقات القريبة", icon: "family_restroom", color: "dawn" },
    done: false,
    can_refresh: true,
  },
  own_challenge: { id: "o", text: "أن أُطفئ الهاتف ساعة قبل النوم", done: false },
  day: { intention: "أن أكون حاضرًا مع أهلي الليلة", reflection: null, closed_at: null },
  registered_activities: [
    { id: "00000000-0000-4000-8000-0000000000e2", title: "نشاط قراءة: أمراض القلوب", mode: "online", next_starts_at: "2026-11-24T15:00:00Z", next_ends_at: null, next_local_date: "2026-11-24", session_count: 4, cancelled: false, dismissed_on: null },
  ],
  activities: [{ id: "00000000-0000-4000-8000-0000000000e2", title: "نشاط قراءة: أمراض القلوب", starts_at: "2026-11-24T15:00:00Z", ends_at: null, location: null, mode: "online" }],
  desired_state:
    "أستيقظ ولي وقتٌ لنفسي قبل أن يبدأ يومي مع الناس. أمشي بخُطًى ثابتة، وأُنجز ما نويت دون استعجالٍ أو ضغط، وأنام وأنا مطمئن أنّي عشتُ يومي كما أحب.",
};
