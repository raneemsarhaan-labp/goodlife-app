import { notFound } from "next/navigation";
import { AddHabitFlow } from "@/components/features/habits/AddHabitFlow";
import { SAMPLE_DOMAINS, SAMPLE_LIBRARY } from "../preview/plan-sample";

export const metadata = { robots: { index: false } };

/**
 * Development-only preview of the add-habit flow with sample data (spec 004 screenshots, design
 * comparison). `?domain=<index>` preselects a domain; `?prefill=1` starts from «اجعلها عادة».
 */
export default async function AddHabitPreview({ searchParams }: { searchParams: Promise<{ domain?: string; prefill?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { domain, prefill } = await searchParams;
  return (
    <main id="main" aria-label="عادة جديدة">
      <AddHabitFlow
        domains={SAMPLE_DOMAINS}
        planDomains={SAMPLE_DOMAINS.slice(0, 3).map((d, i) => ({ domainId: d.id, focusAreaId: d.id, hasDescription: false, habitCount: [2, 1, 0][i]! }))}
        library={SAMPLE_LIBRARY}
        initialDomainId={domain ? SAMPLE_DOMAINS[Number(domain)]?.id : undefined}
        prefill={prefill === "1" ? { name: "اشرب كوب ماء أولًا", duplicate: false } : undefined}
      />
    </main>
  );
}
