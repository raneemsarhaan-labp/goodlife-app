"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { icon } from "@/ui/icons";
import { Icon } from "./Icon";

/** «تقدّمك اليوم»: today's habit completion as a percentage (FR-023), drawn as each version designs it. */
export function ProgressCard({ done, total }: { done: number; total: number }) {
  const t = useTranslations("today");
  const rate = total > 0 ? done / total : 0;
  const pct = formatNumber(rate, undefined, { style: "percent" });
  return (
    <section aria-labelledby="progress-title" className="td-card td-progress">
      <span aria-hidden="true" className="td-progress-art" />
      <div className="td-card-head">
        <h2 id="progress-title" className="td-progress-title">{t("progressTitle")}</h2>
        <Link href="/stats" aria-label={t("viewStats")} title={t("viewStats")} className="td-round td-hit td-menu">
          <Icon src={icon("more_horiz")} />
        </Link>
      </div>
      <div className="td-progress-body">
        <p className="td-progress-title is-compact" aria-hidden="true">{t("progressTitle")}</p>
        <p className="td-progress-label">{t("progressBody")}</p>
        <p className="td-progress-pct">{pct}</p>
        <div
          className="td-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(rate * 100)}
          aria-labelledby="progress-title"
        >
          <span style={{ width: `${rate * 100}%` }} />
        </div>
      </div>
    </section>
  );
}
