import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { reorderHabits } from "@/server/actions/habits";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";
import { HabitName } from "../habits/HabitName";
import { ReorderList } from "../habits/ReorderList";

export async function HabitsByArea({ areas, habits }: { areas: FocusArea[]; habits: PlanHabit[] }) {
  const t = await getTranslations("plan");
  const groups = [
    ...areas.map((a) => ({ key: a.id, title: a.title, habits: habits.filter((h) => h.focus_area_id === a.id) })),
    { key: "none", title: t("unlinked"), habits: habits.filter((h) => !h.focus_area_id) },
  ].filter((g) => g.key !== "none" || g.habits.length > 0);
  return (
    <Card aria-labelledby="habits-by-area" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <CardTitle id="habits-by-area">{t("habitsTitle")}</CardTitle>
        <Link href="/habits/new?returnTo=plan" className="text-sm text-sage-700 underline underline-offset-4">
          {t("addHabit")}
        </Link>
      </div>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`area-${g.key}`} className="flex flex-col gap-2">
          <h3 id={`area-${g.key}`} className="font-medium text-sage-700">{g.title}</h3>
          {g.habits.length === 0 ? (
            <p className="text-sm text-ink-500">{t("noHabitsInArea")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {g.habits.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 rounded-xl bg-sand-50 px-3">
                  <span><HabitName id={h.id} name={h.name} isPrivate={h.is_private} /></span>
                  <Link href={`/habits/${h.id}`} className={buttonClass("quiet", "text-sm")} aria-label={`${t("editHabit")}: ${h.name}`}>
                    {t("editHabit")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {habits.length > 1 && (
        <section aria-labelledby="habits-order" className="flex flex-col gap-2 border-t border-sand-100 pt-4">
          <h3 id="habits-order" className="font-medium">{t("orderTitle")}</h3>
          <ReorderList label={t("orderTitle")} items={habits.map((h) => ({ id: h.id, label: h.name }))} onReorder={reorderHabits} />
        </section>
      )}
    </Card>
  );
}
