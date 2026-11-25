import type { LibraryHabit, LifeDomain } from "@/server/queries/domains";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";

/** Sample «خطتي» data for development-only previews (design comparison). Not used by the app. */
const D = (n: number, key: string, name: string, icon: string, color: LifeDomain["color"]): LifeDomain => ({
  id: `00000000-0000-4000-8000-0000000d000${n}`,
  key,
  name,
  icon,
  color,
  sort_order: n,
  active: true,
});

export const SAMPLE_DOMAINS: LifeDomain[] = [
  D(1, "faith", "الصلة بالله", "auto_stories", "violet"),
  D(2, "self", "النفس والبدن", "self_improvement", "sage"),
  D(3, "family", "العلاقات القريبة", "family_restroom", "dawn"),
  D(4, "work", "العمل والرزق", "work", "gold"),
  D(5, "learning", "العلم والتعلّم", "menu_book", "ink"),
  D(6, "giving", "الإسهام والنفع", "volunteer_activism", "dawn"),
];

const A = (n: number) => `00000000-0000-4000-8000-0000000fa00${n}`;
export const SAMPLE_AREAS: FocusArea[] = [
  {
    id: A(1),
    title: "الصلة بالله",
    description: "من لا يمرّ عليه يومٌ دون وقفةٍ مع القرآن، لا قراءةً عابرٍ بل قراءةً من ينتظر جوابًا.",
    sign: "أن أجد في نفسي شوقًا إلى الوقت قبل أن يحين.",
    sort_order: 1,
    domain_id: SAMPLE_DOMAINS[0]!.id,
    review_on: "2026-12-12",
  },
  {
    id: A(2),
    title: "النفس والبدن",
    description: "من يعامل جسده بجدّية لا بإهمال، ويجد في الحركة راحةً لا عبئًا.",
    sign: "أن أبدأ يومي دون تسويفٍ للحركة.",
    sort_order: 2,
    domain_id: SAMPLE_DOMAINS[1]!.id,
    review_on: "2026-12-18",
  },
  { id: A(3), title: "العلاقات القريبة", description: null, sign: null, sort_order: 3, domain_id: SAMPLE_DOMAINS[2]!.id, review_on: null },
];

const H = (n: number, name: string, area: number | null, icon: string): PlanHabit => ({
  id: `00000000-0000-4000-8000-00000000a00${n}`,
  name,
  description: null,
  focus_area_id: area ? A(area) : null,
  sort_order: n,
  icon,
});
export const SAMPLE_HABITS: PlanHabit[] = [
  H(1, "أذكار الصباح", 1, "wb_sunny"),
  H(2, "وردي من القرآن", 1, "menu_book"),
  H(3, "مشي", 2, "directions_walk"),
  H(4, "النوم قبل الحادية عشرة", 2, "bedtime"),
  H(5, "اتصال بأحد الوالدين", null, "family_restroom"),
];

export const SAMPLE_PLAN = {
  current_state: "أبدأ يومي متأخرًا وأنا مستعجل، وأنام والهاتف في يدي.",
  desired_state:
    "أستيقظ ولي مع ربّي موعدٌ قبل أن يكون لي مع الناس موعد. أمشي في يومي خفيفًا، أُنجز ما نويتُ لا ما طرأ، وأنام وفي نفسي أنّي زدتُ اليوم شيئًا لا يذهب مع النوم.",
  identity:
    "أنا من يبدأ ولا يُكمل، وقد تعبتُ من ذلك. أُحبّ العلم وأنفر من الروتين، وأقوى ما فيّ أنّي أصدق مع نفسي حين أراجعها. صرتُ أعرف أنّ الصغير المستمرّ أنفع لي من الكبير المتقطّع.",
  next_review_on: "2026-11-20",
  updated_at: "2026-11-20T09:00:00Z",
};

const L = (n: number, domain: number, name: string, hint: string, icon: string, amount: string | null = null): LibraryHabit => ({
  id: `00000000-0000-4000-8000-0000000e000${n}`,
  domain_id: SAMPLE_DOMAINS[domain]!.id,
  name,
  amount,
  hint,
  icon,
  sort_order: n,
  active: true,
});
export const SAMPLE_LIBRARY: LibraryHabit[] = [
  L(1, 0, "أذكار الصباح", "قبل مشاغل اليوم", "wb_sunny", "٥ دقائق"),
  L(2, 0, "وردٌ من القرآن", "أي وقتٍ يناسبك", "menu_book", "صفحة"),
  L(3, 0, "اقرأ صفحةً وقف عند آية", "من تحدّي اليوم", "auto_stories"),
  L(4, 0, "صلاة الضحى", "ركعتان خفيفتان", "mosque"),
  L(5, 0, "دعاء قبل النوم", "خاتمة هادئة ليومك", "bedtime"),
  L(6, 1, "مشي", "في الهواء الطلق لا على جهاز", "directions_walk", "٢٠ دقيقة"),
  L(7, 1, "النوم قبل الحادية عشرة", "والهاتف خارج الغرفة", "bedtime"),
];
