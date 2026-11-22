import { notFound } from "next/navigation";
import { ActivityListView } from "@/components/features/community/ActivityList";

export const metadata = { robots: { index: false } };

/** Development-only «المجتمع» activity list with sample data (gallery). */
export default function CommunityPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const base = { description: null, location: null, session_count: 1, registration_open: false, registered: false, places_left: null, window_open: true, is_new: false, presenter: null };
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">المجتمع</h1>
      <ActivityListView
        timeZone="Asia/Riyadh"
        items={[
          { ...base, id: "1", title: "نشاط قراءة: أمراض القلوب", mode: "online", next_starts_at: "2026-11-24T15:00:00Z", session_count: 4, registration_open: true, registered: true, places_left: 17, is_new: true, presenter: "أ. سارة الأحمد" },
          { ...base, id: "2", title: "لقاء الدفعة الشهري", mode: "in_person", next_starts_at: "2026-11-26T14:00:00Z", location: "مركز الحيّ", description: "وقفة مع الشهر الأول." },
          { ...base, id: "3", title: "ورشة: كيف أبني عادة لا تنقطع", mode: "online", next_starts_at: "2026-12-10T16:00:00Z", registration_open: true, places_left: 40, presenter: "د. أحمد" },
        ]}
      />
    </main>
  );
}
