import { notFound } from "next/navigation";
import { AddHabitFlow } from "@/components/features/habits/AddHabitFlow";
import { Sheet } from "@/components/ui/Sheet";
import type { LibraryHabit, LifeDomain } from "@/server/queries/domains";

export const metadata = { robots: { index: false } };

const D = (id: number, key: string, name: string, icon: string, color: LifeDomain["color"]): LifeDomain => ({
  id: `00000000-0000-4000-8000-0000000d000${id}`, key, name, icon, color, sort_order: id, active: true,
});
const DOMAINS = [
  D(1, "faith", "الصلة بالله", "auto_stories", "violet"), D(2, "self", "النفس والبدن", "self_improvement", "sage"),
  D(3, "family", "العلاقات القريبة", "family_restroom", "dawn"), D(4, "work", "العمل والرزق", "work", "gold"),
  D(5, "learning", "العلم والتعلّم", "menu_book", "ink"), D(6, "giving", "الإسهام والنفع", "volunteer_activism", "dawn"),
];
const LIB: LibraryHabit[] = [
  { id: "00000000-0000-4000-8000-0000000e0001", domain_id: DOMAINS[1]!.id, name: "مشي", amount: "٢٠ دقيقة", hint: "في الهواء الطلق لا على جهاز", icon: "directions_walk", sort_order: 1, active: true },
  { id: "00000000-0000-4000-8000-0000000e0002", domain_id: DOMAINS[1]!.id, name: "النوم قبل الحادية عشرة", amount: null, hint: "والهاتف خارج الغرفة", icon: "bedtime", sort_order: 2, active: true },
];

/** Development-only preview of the add-habit flow with sample data (spec 004 screenshots). */
export default async function AddHabitPreview({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { domain } = await searchParams;
  return (
    <Sheet title="عادة جديدة">
      <AddHabitFlow
        domains={DOMAINS}
        planDomains={DOMAINS.slice(0, 3).map((d, i) => ({ domainId: d.id, focusAreaId: d.id, hasDescription: false, habitCount: [2, 1, 0][i]! }))}
        library={LIB}
        initialDomainId={domain ? DOMAINS[Number(domain)]?.id : undefined}
      />
    </Sheet>
  );
}
