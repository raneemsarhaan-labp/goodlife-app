import { getTranslations } from "next-intl/server";
import { bucketKind, bucketLabel, rateOf, type Bucket } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";
import type { Period } from "@/lib/period";
import { PeriodTabs } from "./PeriodTabs";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** The design's short day names («سبت»، «أحد»…): the weekday without its article. */
const DAY_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

/**
 * «هذا الأسبوع / هذا الشهر / هذه السنة» (spec 006 US2): one pill per day, week or month, filled from the
 * bottom with the share of scheduled habit days done; full ones are dark, the current one outlined.
 * Each pill is focusable and names its value (hover or focus shows it too).
 */
export async function CompletionBars({ buckets, period, today, basePath = "/stats" }: { buckets: Bucket[]; period: Period; today: string; basePath?: string }) {
  const t = await getTranslations("impact");
  const kind = bucketKind(buckets);
  const rows = buckets.map((b, i) => {
    const label = bucketLabel(b, kind, (date) => t("weekOf", { date }));
    const short =
      kind === "day" ? DAY_SHORT[new Date(`${b.from}T12:00:00Z`).getUTCDay()]! : kind === "week" ? t("weekN", { n: formatNumber(i + 1) }) : label;
    const rate = rateOf(b.done, b.possible);
    return { ...b, short, rate, current: b.from <= today && today <= b.to, text: t("barValue", { label, rate: pct(rate), done: formatNumber(b.done), possible: formatNumber(b.possible) }) };
  });
  const empty = rows.every((r) => r.possible === 0);
  return (
    <section aria-labelledby="bars-title" className="sc-card">
      <div className="sc-card-head">
        <h2 id="bars-title" className="sc-card-title">{t(`periodTitle.${period}`)}</h2>
        <PeriodTabs active={period} basePath={basePath} />
      </div>
      {empty ? (
        <p className="sc-note">{t("noData")}</p>
      ) : (
        <ul className="sc-chips" aria-label={t("barsTitle")}>
          {rows.map((r) => (
            <li key={r.from} tabIndex={0} aria-label={r.text} className={`sc-chip${r.rate >= 1 ? " is-full" : ""}${r.current ? " is-today" : ""}`}>
              <span aria-hidden="true" className="sc-chip-bar">
                <i style={{ height: `${Math.round(r.rate * 100)}%` }} />
              </span>
              <span aria-hidden="true" className="sc-chip-label">{r.short}</span>
              <span aria-hidden="true" className="sc-chip-tip">{r.text}</span>
            </li>
          ))}
        </ul>
      )}
      <hr className="sc-hr" />
      <p className="sc-note">{t(`periodNote.${kind}`)}</p>
    </section>
  );
}
