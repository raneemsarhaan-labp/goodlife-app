import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { bucketKind, bucketLabel, rateOf, type Bucket } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/**
 * «التزامك مع الوقت» (spec 006 US2): one bar per day / week / month. Single series → no legend; each
 * bar is focusable and shows its value on hover or focus; the same numbers are offered as a table.
 * Marks: thin bars, 4px rounded data end, 2px gaps, recessive baseline (dataviz skill).
 */
export async function CompletionBars({ buckets }: { buckets: Bucket[] }) {
  const t = await getTranslations("impact");
  const kind = bucketKind(buckets);
  const rows = buckets.map((b) => {
    const label = bucketLabel(b, kind, (date) => t("weekOf", { date }));
    const rate = rateOf(b.done, b.possible);
    return { ...b, label, rate, text: t("barValue", { label, rate: pct(rate), done: formatNumber(b.done), possible: formatNumber(b.possible) }) };
  });
  const empty = rows.every((r) => r.possible === 0);
  return (
    <Card aria-labelledby="bars-title" className="flex flex-col gap-3">
      <CardTitle id="bars-title">{t("barsTitle")}</CardTitle>
      <p className="text-sm text-ink-700">{t("barsHint")}</p>
      {empty ? (
        <p className="text-ink-700">{t("noData")}</p>
      ) : (
        <>
          <ul className="flex h-40 items-end gap-0.5 border-b border-sand-200" aria-label={t("barsTitle")}>
            {rows.map((r) => (
              <li key={r.from} tabIndex={0} aria-label={r.text} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
                {/* Hit target is the whole column; the mark is thinner. */}
                <span
                  aria-hidden="true"
                  className="w-3/5 max-w-6 rounded-t-[4px] bg-[var(--chart-mark)] group-hover:opacity-80 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-dawn-700"
                  style={{ height: `${Math.max(r.rate * 100, r.possible > 0 ? 2 : 0)}%` }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-xs text-white group-hover:block group-focus-visible:block"
                >
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="flex gap-0.5">
            {rows.map((r) => (
              <span key={r.from} className="flex-1 truncate text-center text-[0.65rem] text-ink-700">{r.label}</span>
            ))}
          </div>
          <details>
            <summary className="min-h-11 cursor-pointer content-center text-sm text-sage-700 underline underline-offset-4">{t("showTable")}</summary>
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">{t("barsTitle")}</caption>
              <thead>
                <tr className="text-ink-700">
                  <th scope="col" className="py-1 text-start font-medium">{t("colPeriod")}</th>
                  <th scope="col" className="py-1 text-start font-medium">{t("colDone")}</th>
                  <th scope="col" className="py-1 text-start font-medium">{t("colPossible")}</th>
                  <th scope="col" className="py-1 text-start font-medium">{t("colRate")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.from} className="border-t border-sand-200">
                    <th scope="row" className="py-1 text-start font-normal">{r.label}</th>
                    <td className="py-1">{formatNumber(r.done)}</td>
                    <td className="py-1">{formatNumber(r.possible)}</td>
                    <td className="py-1">{pct(r.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  );
}
