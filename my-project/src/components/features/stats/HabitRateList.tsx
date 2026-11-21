import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { MemberStats } from "@/server/queries/stats";
import { RateBar } from "./RateBar";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

export async function HabitRateList({ stats }: { stats: MemberStats }) {
  const t = await getTranslations("stats");
  return (
    <Card aria-labelledby="habit-rates" className="flex flex-col gap-4">
      <CardTitle id="habit-rates">{t("habitsTitle")}</CardTitle>
      {stats.habits.length === 0 && <p className="text-ink-500">{t("noHabits")}</p>}
      <ul className="flex flex-col gap-4">
        {stats.habits.map((h) => {
          const rate = h.possible_days > 0 ? h.done_days / h.possible_days : 0;
          return (
            <li key={h.habit_id} className="flex flex-col gap-1">
              <p className="font-medium">
                {h.name} {h.archived && <span className="text-sm font-normal text-ink-500">({t("archived")})</span>}
              </p>
              <p className="text-sm text-ink-700">{t("habitRate", { done: formatNumber(h.done_days), possible: formatNumber(h.possible_days), rate: pct(rate) })}</p>
              <RateBar rate={rate} />
              <p className="text-sm text-ink-500">{t("streak", { current: formatNumber(h.current_streak), longest: formatNumber(h.longest_streak) })}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
