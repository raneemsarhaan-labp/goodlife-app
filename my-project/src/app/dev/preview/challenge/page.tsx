import { notFound } from "next/navigation";
import { ChallengeListView } from "@/components/features/together/ChallengeListView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_CHALLENGES, SAMPLE_HEADER } from "../screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only «التحدّي» with sample data (gallery). No ranking, by design. */
export default function ChallengePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="pb-24">
      <ChallengeListView header={SAMPLE_HEADER} challenges={SAMPLE_CHALLENGES} />
      <BottomNav current="/stats" />
    </div>
  );
}
