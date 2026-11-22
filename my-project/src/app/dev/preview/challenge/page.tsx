import { notFound } from "next/navigation";
import { ChallengeListView } from "@/components/features/together/ChallengeListView";

export const metadata = { robots: { index: false } };

/** Development-only «التحدّي» with sample data (gallery). No ranking, by design. */
export default function ChallengePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ChallengeListView
      challenges={[
        { id: "a", title: "أسبوع الصلة", description: "سبعة أيام نقرأ فيها وِردًا يوميًّا معًا.", habit_name: "وردي من القرآن", amount: "صفحة", days: 127, starts_on: "2026-11-18", duration_days: 7, domain: "الصلة بالله", status: "active", day: 6, joined: true, kept: 5, possible: 6, group_joined: 7, group_done_today: 4 },
        { id: "b", title: "شهر الحركة", description: "ثلاثون يومًا من المشي.", habit_name: "مشي ١٥ دقيقة", amount: "١٥ دقيقة", days: 127, starts_on: "2026-11-30", duration_days: 30, domain: "النفس والبدن", status: "upcoming", day: 0, joined: false, kept: 0, possible: 0, group_joined: 0, group_done_today: 0 },
      ]}
    />
  );
}
