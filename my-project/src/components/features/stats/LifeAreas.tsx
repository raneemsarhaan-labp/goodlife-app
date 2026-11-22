"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { rateOf } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";
import type { MemberInsights } from "@/server/queries/stats";
import { habitIcon } from "@/ui/icons";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/**
 * «أين تعيش حياتك» (spec 006 US3): per domain, habit count («التوزيع») or completion («الالتزام»), as
 * labelled bars in one colour — domain names carry identity, never colour alone.
 */
export function LifeAreas({ domains }: { domains: MemberInsights["domains"] }) {
  const t = useTranslations("impact");
  const [view, setView] = useState<"spread" | "commitment">("spread");
  const maxHabits = Math.max(1, ...domains.map((d) => d.habits));
  const active = domains.filter((d) => d.possible > 0);
  const average = active.length ? active.reduce((s, d) => s + rateOf(d.done, d.possible), 0) / active.length : 0;
  const list = view === "spread" ? domains : active;
  return (
    <section aria-labelledby="areas-title" className="gl-surface flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
      <h2 id="areas-title" className="text-lg font-semibold text-ink-900">{t("areasTitle")}</h2>
      <div role="group" aria-label={t("areasViews")} className="flex gap-2">
        {(["spread", "commitment"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`min-h-11 rounded-full px-4 text-sm font-medium ${view === v ? "bg-ink-900 text-white" : "text-ink-700 ring-1 ring-sand-200"}`}
          >
            {v === "spread" ? t("areasSpread") : t("areasCommitment")}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="text-ink-700">{t("noData")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((d) => {
            const value = view === "spread" ? d.habits / maxHabits : rateOf(d.done, d.possible);
            const text = view === "spread" ? t("areasHabits", { count: d.habits, n: formatNumber(d.habits) }) : pct(rateOf(d.done, d.possible));
            return (
              <li key={d.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={habitIcon(d.icon)} alt="" aria-hidden="true" width={22} height={22} className="size-[22px] shrink-0" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-ink-900">{d.name}</span>
                    <span className="text-ink-900">{text}</span>
                  </div>
                  <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-sand-100">
                    <span className="block h-full rounded-e-[4px] bg-[var(--chart-mark)]" style={{ width: `${Math.round(value * 100)}%` }} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {view === "commitment" && active.length > 0 && <p className="text-sm text-ink-700">{t("areasAverage", { rate: pct(average) })}</p>}
    </section>
  );
}
