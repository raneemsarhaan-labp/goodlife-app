import { notFound } from "next/navigation";
import { PlanReviewView } from "@/components/features/plan/PlanReviewView";
import { SAMPLE_AREAS, SAMPLE_DOMAINS, SAMPLE_PLAN } from "../plan-sample";

export const metadata = { robots: { index: false } };

/** Development-only «من أنت وما تريد» with sample data; `?empty=1` for a plan with nothing written. */
export default async function PlanReviewPreview({ searchParams }: { searchParams: Promise<{ empty?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const empty = (await searchParams).empty === "1";
  return (
    <PlanReviewView
      today="2026-11-23"
      plan={empty ? { identity: "", desired_state: "" } : SAMPLE_PLAN}
      areas={SAMPLE_AREAS}
      domains={SAMPLE_DOMAINS}
    />
  );
}
