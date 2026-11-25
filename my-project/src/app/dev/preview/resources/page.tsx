import { notFound } from "next/navigation";
import { GuidelinesView } from "@/components/features/resources/GuidelinesView";
import { ResourcesView } from "@/components/features/resources/ResourcesView";
import { SAMPLE_GUIDELINES } from "../screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only «الموارد» and (`?norms=1`) «أعراف الرحلة» with sample data (design comparison). */
export default async function ResourcesPreview({ searchParams }: { searchParams: Promise<{ norms?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const norms = (await searchParams).norms === "1";
  return norms ? <GuidelinesView items={SAMPLE_GUIDELINES} /> : <ResourcesView counts={{ file: 1, recording: 3, reference: 17 }} />;
}
