"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { rateOf } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";
import type { MemberInsights } from "@/server/queries/stats";
import { Icon } from "@/ui/components/Icon";
import { habitIcon } from "@/ui/icons";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

// The design's wheel: 260 px, sectors between radius 36 and 100, labels on radius 128.
const C = 130;
const R_MIN = 36;
const R_MAX = 100;
const R_LABEL = 128;

function arc(r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) =>
    `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

/** The domain's short name on the wheel, as the design writes it («الصلة»، «النفس»…). */
const shortName = (name: string) => name.split(/\s+/)[0] ?? name;

/**
 * «أين تعيش حياتك» (spec 006 US3) as the design's wheel. «التوزيع»: each sector's length is the number
 * of habits in the domain. «الالتزام»: the domains with habits, each filled to its completion. The
 * labels around the wheel are the list items (name and value as text); colour never carries meaning alone.
 */
export function LifeAreas({ domains }: { domains: MemberInsights["domains"] }) {
  const t = useTranslations("impact");
  const [view, setView] = useState<"spread" | "commitment">("spread");
  const withHabits = domains.filter((d) => d.habits > 0);
  const active = domains.filter((d) => d.possible > 0);
  const average = active.length
    ? active.reduce((s, d) => s + rateOf(d.done, d.possible), 0) / active.length
    : 0;
  const totalHabits = domains.reduce((s, d) => s + d.habits, 0);
  const maxHabits = Math.max(1, ...domains.map((d) => d.habits));
  const list = view === "spread" ? domains : active;
  const n = list.length;
  const gap = view === "spread" ? 0.06 : 0.08;
  const step = n ? (Math.PI * 2) / n : 0;
  const sectors = list.map((d, i) => {
    const a0 = -Math.PI / 2 + i * step + gap / 2;
    const a1 = -Math.PI / 2 + (i + 1) * step - gap / 2;
    const mid = (a0 + a1) / 2;
    const rate = rateOf(d.done, d.possible);
    const value =
      view === "spread"
        ? t("areasHabits", { count: d.habits, n: formatNumber(d.habits) })
        : pct(rate);
    return {
      d,
      a0,
      a1,
      rate,
      value,
      x: Math.round((C + R_LABEL * Math.cos(mid)) * 10) / 10,
      y: Math.round((C + R_LABEL * Math.sin(mid)) * 10) / 10,
    };
  });
  return (
    <section aria-label={t("areasTitle")} className="sc-card">
      <div className="sc-card-head">
        <h2 className="sc-card-title">
          {view === "spread" ? t("areasTitle") : t("areasCommitmentTitle")}
        </h2>
        <div role="group" aria-label={t("areasViews")} className="sc-pills">
          {(["spread", "commitment"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="sc-pill"
            >
              {v === "spread" ? t("areasSpread") : t("areasCommitment")}
            </button>
          ))}
        </div>
      </div>
      {n === 0 ? (
        <p className="sc-note">{t("noData")}</p>
      ) : (
        <div className="sc-wheel-wrap">
          <div className="sc-wheel">
            <svg
              width="260"
              height="260"
              viewBox="0 0 260 260"
              aria-hidden="true"
              focusable="false"
            >
              {sectors.map(({ d, a0, a1, rate }) =>
                view === "spread" ? (
                  <path
                    key={d.id}
                    className={`sc-d-${d.color}`}
                    d={arc(
                      R_MIN,
                      d.habits > 0 ? R_MIN + (d.habits / maxHabits) * (R_MAX - R_MIN) : R_MIN + 6,
                      a0,
                      a1,
                    )}
                    fill="var(--sc-wc)"
                    opacity={d.habits > 0 ? 0.85 : 0.25}
                  />
                ) : (
                  <g key={d.id} className={`sc-d-${d.color}`}>
                    <path d={arc(R_MIN, R_MAX, a0, a1)} fill="var(--sc-wb)" />
                    {rate > 0 && (
                      <path
                        d={arc(R_MIN, R_MIN + rate * (R_MAX - R_MIN), a0, a1)}
                        fill="var(--sc-wc)"
                      />
                    )}
                  </g>
                ),
              )}
              <circle cx={C} cy={C} r={R_MIN - 4} fill="var(--surface)" />
            </svg>
            <ul className="sc-wheel-labels">
              {sectors.map(({ d, value, x, y }) => (
                <li
                  key={d.id}
                  className={`sc-wheel-label sc-d-${d.color}${view === "spread" && d.habits === 0 ? " is-empty" : ""}`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  aria-label={`${d.name}: ${value}`}
                >
                  <Icon src={habitIcon(d.icon)} className="sc-icon" />
                  <span aria-hidden="true">
                    {shortName(d.name)}{" "}
                    {view === "spread" ? formatNumber(d.habits) : pct(rateOf(d.done, d.possible))}
                  </span>
                </li>
              ))}
            </ul>
            <p aria-hidden="true" className="sc-wheel-center">
              <b>{view === "spread" ? formatNumber(totalHabits) : pct(average)}</b>
              <span>
                {view === "spread"
                  ? t("areasCenterSpread", {
                      count: withHabits.length,
                      n: formatNumber(withHabits.length),
                    })
                  : t("areasCenterCommitment", {
                      count: active.length,
                      n: formatNumber(active.length),
                    })}
              </span>
            </p>
          </div>
        </div>
      )}
      <hr className="sc-hr" />
      <p className="sc-note">
        {view === "spread" ? t("areasSpreadNote") : t("areasCommitmentNote")}
        {view === "commitment" && active.length > 0 && (
          <span className="sc-sr"> {t("areasAverage", { rate: pct(average) })}</span>
        )}
      </p>
    </section>
  );
}
