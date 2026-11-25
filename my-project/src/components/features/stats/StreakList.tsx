import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { PRIVATE_PLACEHOLDER } from "@/lib/private-habits";
import type { MemberStats } from "@/server/queries/stats";
import { Icon } from "@/ui/components/Icon";
import { habitIcon } from "@/ui/icons";
import { HabitName } from "../habits/HabitName";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/**
 * «السلاسل» (spec 006, FR-035): each habit's current run of days, with the weekly grace when it was
 * used; the bar is the habit's share of scheduled days done (also given as text to screen readers).
 * Tones follow the design's four rows in turn.
 */
export async function StreakList({ stats, icons }: { stats: MemberStats; icons: Record<string, string | null> }) {
  const [t, ti] = await Promise.all([getTranslations("stats"), getTranslations("impact")]);
  return (
    <section aria-labelledby="habit-rates" className="sc-card">
      <h2 id="habit-rates" className="sc-card-title">{t("streaksTitle")}</h2>
      <p className="sc-note" style={{ marginBottom: 0 }}>{ti("graceHint")}</p>
      {stats.habits.length === 0 ? (
        <p className="sc-note">{t("noHabits")}</p>
      ) : (
        <ul className="sc-streaks">
          {stats.habits.map((h, i) => {
            const rate = h.possible_days > 0 ? h.done_days / h.possible_days : 0;
            return (
              <li key={h.habit_id} className={`sc-streak sc-tone-${i % 4}`}>
                <span aria-hidden="true" className="sc-streak-icon">
                  <Icon src={habitIcon(icons[h.habit_id])} className="sc-icon" />
                </span>
                <div className="sc-streak-body">
                  <div className="sc-streak-top">
                    <span className="sc-streak-name">
                      <HabitName id={h.habit_id} name={h.name} isPrivate={h.name === PRIVATE_PLACEHOLDER} />
                      {h.archived && <span className="sc-muted"> ({t("archived")})</span>}
                    </span>
                    <span className="sc-streak-days">
                      {t("streakDays", { count: h.current_streak, n: formatNumber(h.current_streak) })}
                      {h.grace_this_week && <> · {ti("graceUsed")}</>}
                    </span>
                  </div>
                  <span aria-hidden="true" className="sc-streak-bar">
                    <i style={{ width: `${Math.round(rate * 100)}%` }} />
                  </span>
                  <span className="sc-sr">
                    {t("habitRate", { done: formatNumber(h.done_days), possible: formatNumber(h.possible_days), rate: pct(rate) })} ·{" "}
                    {t("streak", { current: formatNumber(h.current_streak), longest: formatNumber(h.longest_streak) })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
