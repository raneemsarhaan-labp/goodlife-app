import { notFound } from "next/navigation";
import { HabitEditForm } from "@/components/features/habits/HabitEditForm";
import { SAMPLE_AREAS, SAMPLE_DOMAINS } from "../plan-sample";

export const metadata = { robots: { index: false } };

/** Development-only «تعديل العادة» with a sample habit (design comparison). */
export default async function HabitEditPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main id="main" aria-label="تعديل العادة">
      <HabitEditForm
        habit={{
          id: "00000000-0000-4000-8000-00000000a003",
          name: "مشي",
          description: "في الهواء الطلق لا على جهاز",
          focus_area_id: SAMPLE_AREAS[1]!.id,
          icon: "directions_walk",
          domain_id: SAMPLE_DOMAINS[1]!.id,
          amount: "٢٠ دقيقة",
          time_of_day: "evening",
          days: 0b1011111,
          shared_with_group: true,
          is_private: false,
          group_challenge_id: null,
        }}
        areas={SAMPLE_AREAS}
        domains={SAMPLE_DOMAINS}
      />
    </main>
  );
}
