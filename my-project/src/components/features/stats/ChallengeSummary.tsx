import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import type { MemberStats } from "@/server/queries/stats";

/**
 * Journey and own challenges, always shown separately (FR-035), and the days closed. Not drawn in
 * the design; it uses the design's compare boxes so it reads as part of the same screen.
 */
export async function ChallengeSummary({ stats }: { stats: MemberStats }) {
  const t = await getTranslations("stats");
  const box = (key: string, text: string, rate: number, colour: string) => (
    <li key={key} className="sc-compare-box">
      <p className="sc-compare-label" style={{ fontSize: 12.5, lineHeight: "18px", color: "var(--ink-900)" }}>{text}</p>
      <span aria-hidden="true" className="sc-bar">
        <i style={{ width: `${Math.round(Math.min(Math.max(rate, 0), 1) * 100)}%`, background: colour }} />
      </span>
    </li>
  );
  return (
    <section aria-labelledby="challenges" className="sc-card">
      <h2 id="challenges" className="sc-card-title">{t("challengesTitle")}</h2>
      <ul className="sc-mini-grid">
        {box("journey", t("journey", { done: formatNumber(stats.journey_done), total: formatNumber(stats.journey_total) }), stats.journey_total ? stats.journey_done / stats.journey_total : 0, "var(--green-700)")}
        {box("own", t("own", { done: formatNumber(stats.own_done), written: formatNumber(stats.own_written) }), stats.own_written ? stats.own_done / stats.own_written : 0, "var(--terracotta-500)")}
      </ul>
      <hr className="sc-hr" />
      <p className="sc-note">{t("daysClosed", { count: formatNumber(stats.days_closed), days: formatNumber(stats.days) })}</p>
    </section>
  );
}
