import { notFound } from "next/navigation";
import { CommunityView } from "@/components/features/community/CommunityView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_ACTIVITIES, SAMPLE_GROUP, SAMPLE_HEADER, SAMPLE_RECEIVED } from "../screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only «المجتمع» with sample data (gallery and design comparison); `?open=1` opens the first card. */
export default async function CommunityPreview({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const open = (await searchParams).open === "1";
  return (
    <div className="pb-24" data-open-first={open ? "1" : undefined}>
      <CommunityView header={SAMPLE_HEADER} items={SAMPLE_ACTIVITIES} group={SAMPLE_GROUP} encouragementOn received={SAMPLE_RECEIVED} />
      <BottomNav current="/community" />
    </div>
  );
}
