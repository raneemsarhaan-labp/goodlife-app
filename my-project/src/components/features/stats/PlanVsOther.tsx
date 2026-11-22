import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { rateOf } from "@/lib/buckets";
import { formatNumber } from "@/lib/format";
import type { MemberInsights } from "@/server/queries/stats";
import { RateBar } from "./RateBar";

const pct = (r: number) => formatNumber(r, undefined, { style: "percent" });

/** «خطتي مقابل ما سواها» (spec 006 FR-003): two labelled rates and a short note. */
export async function PlanVsOther({ data }: { data: MemberInsights["plan_vs_other"] }) {
  const t = await getTranslations("impact");
  const plan = rateOf(data.plan_done, data.plan_possible);
  const other = rateOf(data.other_done, data.other_possible);
  const note =
    data.plan_possible === 0 ? t("noPlan") : data.other_possible === 0 || Math.abs(plan - other) < 0.05 ? t("even") : plan > other ? t("planAhead") : t("otherAhead");
  const row = (label: string, rate: number) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-ink-900">{label}</span>
        <span className="text-ink-900">{pct(rate)}</span>
      </div>
      <RateBar rate={rate} />
    </div>
  );
  return (
    <Card aria-labelledby="plan-vs" className="flex flex-col gap-3">
      <CardTitle id="plan-vs">{t("planTitle")}</CardTitle>
      {data.plan_possible > 0 && row(t("planLabel"), plan)}
      {data.other_possible > 0 && row(t("otherLabel"), other)}
      <p className="text-sm text-ink-700">{note}</p>
    </Card>
  );
}
