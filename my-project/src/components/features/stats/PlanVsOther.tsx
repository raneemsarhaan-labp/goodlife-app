import { getTranslations } from "next-intl/server";
import { rateOf } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";
import type { MemberInsights } from "@/server/queries/stats";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** «خطتي مقابل ما سواها» (spec 006 FR-003): two labelled rates and a short note, as the design's boxes. */
export async function PlanVsOther({ data }: { data: MemberInsights["plan_vs_other"] }) {
  const t = await getTranslations("impact");
  const plan = rateOf(data.plan_done, data.plan_possible);
  const other = rateOf(data.other_done, data.other_possible);
  const note =
    data.plan_possible === 0 ? t("noPlan") : data.other_possible === 0 || Math.abs(plan - other) < 0.05 ? t("even") : plan > other ? t("planAhead") : t("otherAhead");
  // The design puts «عاداتي الأخرى» on the start side, in terracotta; the plan in green.
  const boxes = [
    data.other_possible > 0 && { key: "other", label: t("otherLabel"), rate: other, text: "var(--td-accent-text)", bar: "var(--terracotta-500)" },
    data.plan_possible > 0 && { key: "plan", label: t("planLabel"), rate: plan, text: "var(--green-700)", bar: "var(--green-700)" },
  ].filter((b) => b !== false);
  return (
    <section aria-labelledby="plan-vs" className="sc-card sc-compare">
      <div aria-hidden="true" className="sc-accent" />
      <h2 id="plan-vs">{t("planTitle")}</h2>
      {boxes.length > 0 && (
        <ul className={`sc-compare-grid${boxes.length === 1 ? " is-single" : ""}`}>
          {boxes.map((b) => (
            <li key={b.key} className="sc-compare-box">
              <p className="sc-compare-num" style={{ color: b.text }}>{pct(b.rate)}</p>
              <p className="sc-compare-label">{b.label}</p>
              <span aria-hidden="true" className="sc-bar">
                <i style={{ width: `${Math.round(b.rate * 100)}%`, background: b.bar }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <hr className="sc-hr" />
      <p className="sc-note">{note}</p>
    </section>
  );
}
