import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { formatNumber } from "@/lib/format";
import type { Period } from "@/lib/period";
import { Icon } from "@/ui/components/Icon";
import { icon, type IconName } from "@/ui/icons";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** The commitment ring (decorative; the value is the text inside it). The design's 64-unit ring. */
function Ring({ rate, label }: { rate: number; label: string }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(rate, 0), 1);
  return (
    <svg viewBox="0 0 64 64" className="sc-ring" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth="7" />
      {v > 0 && (
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--green-700)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform="rotate(-90 32 32)" />
      )}
      <text x="32" y="37" textAnchor="middle" fontSize="15" fill="var(--ink-900)">
        {label}
      </text>
    </svg>
  );
}

type TileStyle = CSSProperties & { "--sc-tile-circle"?: string; "--sc-tile-fg"?: string };

/** «لمحة» (spec 006 US1): consecutive days, commitment ring, active habits, challenges done. */
export async function StatTiles({
  consecutive,
  rate,
  done,
  possible,
  activeHabits,
  challengesDone,
  period,
}: {
  consecutive: number;
  rate: number;
  done: number;
  possible: number;
  activeHabits: number;
  challengesDone: number;
  period: Period;
}) {
  const [t, ts] = await Promise.all([getTranslations("impact"), getTranslations("stats")]);
  const tile = (key: string, n: number, label: string, iconName: IconName, style: TileStyle) => (
    <li key={key} className="sc-tile">
      <span aria-hidden="true" className="sc-tile-icon" style={style}>
        <Icon src={icon(iconName)} className="sc-icon" />
      </span>
      <p className="sc-tile-num">{formatNumber(n)}</p>
      <p className="sc-tile-label">{label}</p>
    </li>
  );
  return (
    <section aria-labelledby="tiles">
      <h2 id="tiles" className="sc-sr">{t("tilesTitle")}</h2>
      <ul className="sc-tiles">
        {tile("consecutive", consecutive, t("consecutiveUnit", { count: consecutive }), "calendar_month", { "--sc-tile-circle": "oklch(93% 0.03 150)" })}
        <li className="sc-tile is-ring">
          <Ring rate={rate} label={pct(rate)} />
          <p className="sc-tile-label">
            {t(`commitmentFor.${period}`)}
            <span className="sc-sr"> {pct(rate)} · {ts("overallDetail", { done: formatNumber(done), possible: formatNumber(possible) })}</span>
          </p>
        </li>
        {tile("active", activeHabits, t("activeUnit", { count: activeHabits }), "bolt", { "--sc-tile-circle": "oklch(92% 0.03 240)" })}
        {tile("challenges", challengesDone, t("challengesUnit", { count: challengesDone }), "star", { "--sc-tile-circle": "var(--terracotta-100)", "--sc-tile-fg": "var(--terracotta-500)" })}
      </ul>
    </section>
  );
}
