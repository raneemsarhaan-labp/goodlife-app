import { notFound } from "next/navigation";
import { TogetherView } from "@/components/features/together/TogetherView";

export const metadata = { robots: { index: false } };

/** Development-only «مجموعتي» with sample data (gallery). */
export default function TogetherPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const item = (user_id: string, name: string, habit: string, done: boolean, together = 1, me = false) => ({ user_id, name, habit, done, together, me });
  return (
    <TogetherView
      data={{
        group: { id: "g", name: "مجموعة النور", cohort: "الدفعة الثالثة", start_date: "2026-11-12", members: 9 },
        sharing: true,
        items: [
          item("me", "أنت", "أذكار الصباح", false, 3, true),
          item("me", "أنت", "قراءة قبل النوم", false, 1, true),
          item("s", "سارة", "أذكار الصباح", true, 3),
          item("s", "سارة", "جلسة بلا هاتف مع الأسرة", false),
          item("m", "مريم", "أذكار الصباح", true, 3),
          item("m", "مريم", "مشي ٢٠ دقيقة", true),
          item("k", "خالد", "وردي من القرآن", false),
        ],
      }}
    />
  );
}
