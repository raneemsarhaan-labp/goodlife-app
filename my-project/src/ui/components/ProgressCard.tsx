"use client";

import { IonProgressBar } from "@ionic/react";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import { GlassCard } from "./GlassCard";

/** «تقدّمك اليوم»: today's habit completion as a percentage (FR-023). */
export function ProgressCard({ done, total }: { done: number; total: number }) {
  const t = useTranslations("today");
  const rate = total > 0 ? done / total : 0;
  return (
    <GlassCard title={t("progressTitle")} titleId="progress-title">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-4xl font-bold text-sage-700">{formatNumber(rate, undefined, { style: "percent" })}</p>
          <p className="text-sm text-ink-700">{t("progressBody")}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative, tiny, theme-dependent */}
        <img src="/ui/art-progress.webp" alt="" width={96} height={64} loading="lazy" className="h-16 w-24 object-contain" />
      </div>
      <IonProgressBar value={rate} className="mt-3 h-2 rounded-full [--background:var(--ink-100)] [--progress-background:var(--green-500)]" aria-hidden="true" />
    </GlassCard>
  );
}
