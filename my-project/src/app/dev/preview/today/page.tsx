import { notFound } from "next/navigation";
import { DesiredStateCard } from "@/components/features/today/DesiredStateCard";
import { Greeting } from "@/components/features/today/Greeting";
import { RegisteredActivityCard } from "@/components/features/today/RegisteredActivityCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { TodayIslandClient } from "@/ui/views/TodayIsland.client";
import { SAMPLE_TODAY } from "../sample";

export const metadata = { robots: { index: false } };

/** Development-only «يومك» with sample data (gallery). `?ritual=1` shows the opening quote. */
export default async function TodayPreview({ searchParams }: { searchParams: Promise<{ ritual?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const ritual = (await searchParams).ritual === "1";
  const d = SAMPLE_TODAY;
  return (
    <>
      <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pb-28 pt-6">
        <Greeting name="سلمان العتيبي" timeZone={d.time_zone} localDate={d.local_date} journeyDay={d.journey_day} />
        <DesiredStateCard text={d.desired_state ?? ""} localDate={d.local_date} />
        <RegisteredActivityCard
          timeZone={d.time_zone}
          activity={{ id: "00000000-0000-4000-8000-0000000000e2", title: "نشاط قراءة: أمراض القلوب", mode: "online", next_starts_at: "2026-11-24T15:00:00Z", next_ends_at: null, next_local_date: "2026-11-24", session_count: 4, cancelled: false, dismissed_on: null }}
        />
        <TodayIslandClient
          data={d}
          isToday
          ritual={ritual ? { show: true, quote: { text: "ليس المطلوب أن يكتمل كل شيء، بل أن تستمر.", source: "من أعراف الرحلة" } } : { show: false, quote: null }}
        />
      </main>
      <BottomNav />
    </>
  );
}
