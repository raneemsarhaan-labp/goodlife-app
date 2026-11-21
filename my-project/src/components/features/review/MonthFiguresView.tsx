import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import type { MonthFigures } from "@/server/queries/reviews";

/** The month's facts, each as plain text (no chart-only information; WCAG). */
export async function MonthFiguresView({ figures }: { figures: MonthFigures }) {
  const t = await getTranslations("review");
  const rate = figures.habits_possible > 0 ? figures.habits_done / figures.habits_possible : 0;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-medium">{t("overall", { rate: formatNumber(rate, undefined, { style: "percent" }) })}</p>
      <ul className="flex flex-col gap-2">
        {figures.habits.map((h) => {
          const r = h.possible_days > 0 ? h.done_days / h.possible_days : 0;
          return (
            <li key={h.habit_id} className="flex flex-col gap-1">
              <span>
                {t("habitRate", { name: h.name, done: formatNumber(h.done_days), possible: formatNumber(h.possible_days) })}{" "}
                {h.archived && <span className="text-sm text-ink-500">{t("archivedNote")}</span>}
              </span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sand-100">
                <span className="block h-full rounded-full bg-sage-600" style={{ width: `${Math.round(r * 100)}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      <p>{t("journeyDone", { done: formatNumber(figures.journey_done), total: formatNumber(figures.journey_total) })}</p>
      <p>{t("ownDone", { done: formatNumber(figures.own_done), written: formatNumber(figures.own_written) })}</p>
      <p>{t("daysClosed", { count: formatNumber(figures.days_closed) })}</p>
    </div>
  );
}
