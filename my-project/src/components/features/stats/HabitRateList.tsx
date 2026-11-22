import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { MemberStats } from "@/server/queries/stats";
import { PRIVATE_PLACEHOLDER } from "@/lib/private-habits";
import { HabitName } from "../habits/HabitName";
import { RateBar } from "./RateBar";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

export async function HabitRateList({ stats }: { stats: MemberStats }) {
  const t = await getTranslations("stats");
  const ti = await getTranslations("impact");
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
                <HabitName id={h.habit_id} name={h.name} isPrivate={h.name === PRIVATE_PLACEHOLDER} /> {h.archived && <span className="text-sm font-normal text-ink-500">({t("archived")})</span>}
              </p>
              <p className="text-sm text-ink-700">{t("habitRate", { done: formatNumber(h.done_days), possible: formatNumber(h.possible_days), rate: pct(rate) })}</p>
              <RateBar rate={rate} />
              <p className="text-sm text-ink-500">
                {t("streak", { current: formatNumber(h.current_streak), longest: formatNumber(h.longest_streak) })}
                {h.grace_this_week && (
                  <span title={ti("graceHint")} className="ms-2 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-ink-900">{ti("graceUsed")}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
