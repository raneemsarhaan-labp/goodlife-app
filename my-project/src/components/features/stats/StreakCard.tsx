import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { MemberStats } from "@/server/queries/stats";

export async function StreakCard({ stats }: { stats: MemberStats }) {
  const t = await getTranslations("stats");
  const best = [...stats.habits].filter((h) => !h.archived).sort((a, b) => b.current_streak - a.current_streak)[0];
  return (
    <Card aria-labelledby="best-streak">
      <CardTitle id="best-streak">{t("bestStreakTitle")}</CardTitle>
      <p className="mt-1 text-ink-700">
        {best && best.current_streak > 0 ? t("bestStreak", { days: formatNumber(best.current_streak), name: best.name }) : t("noStreak")}
      </p>
    </Card>
  );
}
