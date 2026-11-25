import { notFound } from "next/navigation";
import { ReflectionsView } from "@/components/features/plan/ReflectionsView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_PLAN } from "../plan-sample";

export const metadata = { robots: { index: false } };

/** Development-only «تأمّلاتي» with sample notes (design comparison). */
export default async function ReflectionsPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="pb-24">
      <ReflectionsView
        rows={[
          { local_date: "2026-11-23", kind: "pause", id: "00000000-0000-4000-8000-0000000c0001", text: "مشيتُ بعد العصر بدل أن أفتح الهاتف، وشعرتُ أنّ اليوم أخفّ.", desired_state_snapshot: SAMPLE_PLAN.desired_state, created_at: "2026-11-23T14:00:00Z" },
          { local_date: "2026-11-23", kind: "closing", id: null, text: "يومٌ هادئ. أنجزتُ ما نويتُ إلا القراءة.", desired_state_snapshot: null, created_at: "2026-11-23T20:00:00Z" },
          { local_date: "2026-11-22", kind: "pause", id: "00000000-0000-4000-8000-0000000c0002", text: "وقفتُ عند آية في الورد وبقيت معي طوال اليوم.", desired_state_snapshot: SAMPLE_PLAN.desired_state, created_at: "2026-11-22T08:00:00Z" },
        ]}
        olderHref="/dev/preview/reflections"
        newerHref={null}
      />
      <BottomNav />
    </div>
  );
}
