import { notFound } from "next/navigation";
import { TogetherView } from "@/components/features/together/TogetherView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_CHALLENGES, SAMPLE_HEADER, SAMPLE_TOGETHER } from "../screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only «مجموعتي» with sample data (gallery). */
export default function TogetherPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="pb-24">
      <TogetherView header={SAMPLE_HEADER} data={SAMPLE_TOGETHER} challenge={SAMPLE_CHALLENGES[0]} />
      <BottomNav current="/stats" />
    </div>
  );
}
