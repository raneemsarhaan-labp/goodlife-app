import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { reorderHabits } from "@/server/actions/habits";
import type { FocusArea, PlanHabit } from "@/server/queries/plan";
import { icon } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";
import { HabitName } from "../habits/HabitName";
import { ReorderList } from "../habits/ReorderList";

/**
 * «عاداتك حسب المجال»: each habit as the designed habit row (thin icon, name, a round go button to
 * its edit page), grouped under the domain label with the leaf; then the order of «يومك».
 */
export async function HabitsByArea({ areas, habits }: { areas: FocusArea[]; habits: PlanHabit[] }) {
  const t = await getTranslations("plan");
  const groups = [
    ...areas.map((a) => ({ key: a.id, title: a.title, habits: habits.filter((h) => h.focus_area_id === a.id) })),
    { key: "none", title: t("unlinked"), habits: habits.filter((h) => !h.focus_area_id) },
  ].filter((g) => g.key !== "none" || g.habits.length > 0);
  return (
    <section aria-labelledby="habits-by-area" className="pn-section">
      <div className="pn-section-head is-small">
        <h2 id="habits-by-area">{t("habitsTitle")}</h2>
        <span className="pn-line" aria-hidden="true" />
        <Link href="/habits/new?returnTo=plan" className="pn-link">
          {t("addHabit")}
        </Link>
      </div>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`area-${g.key}`}>
          <h3 id={`area-${g.key}`} className="pn-group-label">
            <Icon src={icon("eco")} />
            {g.title}
          </h3>
          {g.habits.length === 0 ? (
            <p className="pn-empty-row">{t("noHabitsInArea")}</p>
          ) : (
            <ul className="pn-rows">
              {g.habits.map((h) => (
                <li key={h.id} className="pn-row">
                  <Icon src={habitIconThin(h.icon)} className="pn-row-icon" />
                  <span className="pn-row-name">
                    <HabitName id={h.id} name={h.name} isPrivate={h.is_private} />
                  </span>
                  <Link href={`/habits/${h.id}`} className="pn-row-go td-hit" aria-label={`${t("editHabit")}: ${h.name}`}>
                    <Icon src={icon("chevron_left")} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {habits.length > 1 && (
        <section aria-labelledby="habits-order" className="pn-reorder mt-5">
          <h3 id="habits-order" className="pn-group-label">
            <Icon src={flowIcon("reorder")} />
            {t("orderTitle")}
          </h3>
          <ReorderList label={t("orderTitle")} items={habits.map((h) => ({ id: h.id, label: h.name }))} onReorder={reorderHabits} />
        </section>
      )}
    </section>
  );
}
