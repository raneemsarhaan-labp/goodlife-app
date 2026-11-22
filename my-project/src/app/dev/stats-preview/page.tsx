import { notFound } from "next/navigation";
import { CompletionBars } from "@/components/features/stats/CompletionBars";
import { LifeAreas } from "@/components/features/stats/LifeAreas";
import { PlanVsOther } from "@/components/features/stats/PlanVsOther";
import { StatTiles } from "@/components/features/stats/StatTiles";

export const metadata = { robots: { index: false } };

const day = (i: number) => `2026-11-${String(16 + i).padStart(2, "0")}`;

/** Development-only preview of spec 006 charts with sample data (screenshots and axe). */
export default function StatsPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6">
      <h1 className="text-2xl font-semibold">أثرك</h1>
      <StatTiles consecutive={12} rate={0.74} activeHabits={5} challengesDone={9} />
      <CompletionBars buckets={[4, 3, 5, 2, 4, 5, 1].map((done, i) => ({ from: day(i), to: day(i), done, possible: 5 }))} />
      <PlanVsOther data={{ plan_done: 24, plan_possible: 28, other_done: 6, other_possible: 14 }} />
      <LifeAreas
        domains={[
          { id: "1", name: "الصلة بالله", icon: "auto_stories", color: "violet", habits: 2, done: 13, possible: 14 },
          { id: "2", name: "النفس والبدن", icon: "self_improvement", color: "sage", habits: 2, done: 9, possible: 14 },
          { id: "3", name: "العلاقات القريبة", icon: "family_restroom", color: "dawn", habits: 0, done: 0, possible: 0 },
          { id: "4", name: "العمل والرزق", icon: "work", color: "gold", habits: 0, done: 0, possible: 0 },
          { id: "5", name: "العلم والتعلّم", icon: "menu_book", color: "ink", habits: 1, done: 5, possible: 7 },
        ]}
      />
    </main>
  );
}
