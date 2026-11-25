import { notFound } from "next/navigation";
import { StatsView } from "@/components/features/stats/StatsView";
import { SAMPLE_HEADER, SAMPLE_ICONS, SAMPLE_INSIGHTS, SAMPLE_STATS, SAMPLE_TODAY_DATE } from "../preview/screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only preview of spec 006 «أثرك» with sample data (screenshots and axe); see also /dev/preview/stats. */
export default function StatsPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StatsView header={SAMPLE_HEADER} period="week" today={SAMPLE_TODAY_DATE} stats={SAMPLE_STATS} insights={SAMPLE_INSIGHTS} icons={SAMPLE_ICONS} />;
}
