import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** Hero ring: decorative; the value is the text inside it (dataviz: hero number, not a chart). */
function Ring({ rate }: { rate: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--ink-100)" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--chart-mark)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * Math.min(Math.max(rate, 0), 1)} ${c}`} />
    </svg>
  );
}

/** «لمحة» (spec 006 US1): consecutive days, commitment ring, active habits, challenges done. */
export async function StatTiles({ consecutive, rate, activeHabits, challengesDone }: { consecutive: number; rate: number; activeHabits: number; challengesDone: number }) {
  const t = await getTranslations("impact");
  const tile = "gl-surface flex flex-col justify-center gap-1 rounded-[var(--radius-card)] p-4";
  return (
    <section aria-labelledby="tiles" className="flex flex-col gap-2">
      <h2 id="tiles" className="sr-only">{t("tilesTitle")}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className={tile}>
          <p className="text-3xl font-semibold text-ink-900">{formatNumber(consecutive)}</p>
          <p className="text-sm text-ink-700">{t("consecutiveLabel")}</p>
        </div>
        <div className={`${tile} flex-row items-center gap-3`}>
          <div className="relative flex size-20 shrink-0 items-center justify-center">
            <Ring rate={rate} />
            <span className="absolute text-lg font-semibold text-ink-900">{pct(rate)}</span>
          </div>
          <p className="text-sm text-ink-700">{t("commitment")}</p>
        </div>
        <div className={tile}>
          <p className="text-3xl font-semibold text-ink-900">{formatNumber(activeHabits)}</p>
          <p className="text-sm text-ink-700">{t("activeHabits")}</p>
        </div>
        <div className={tile}>
          <p className="text-3xl font-semibold text-ink-900">{formatNumber(challengesDone)}</p>
          <p className="text-sm text-ink-700">{t("challengesDone")}</p>
        </div>
      </div>
    </section>
  );
}
