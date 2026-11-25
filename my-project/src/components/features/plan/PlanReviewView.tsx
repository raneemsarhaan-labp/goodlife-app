import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { saveDesiredState, saveIdentity } from "@/server/actions/plan";
import type { LifeDomain } from "@/server/queries/domains";
import type { FocusArea } from "@/server/queries/plan";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { FlowHeader } from "../habits/FlowHeader";
import { DomainForm } from "./DomainCards";
import { PlanReviewSchedule } from "./PlanReviewSchedule";
import { ReviewTexts } from "./ReviewTexts";

/**
 * «من أنت وما تريد» (spec 005 US3) as the Glass Edition draws it, on one page: reread «هويّتي» and
 * «حالي المنشود» (and edit them), then each plan domain, then choose the next review date.
 */
export async function PlanReviewView({
  today,
  plan,
  areas,
  domains,
}: {
  today: string;
  plan: { identity: string; desired_state: string };
  areas: FocusArea[];
  domains: LifeDomain[];
}) {
  const t = await getTranslations("planReview");
  const ti = await getTranslations("identity");
  const td = await getTranslations("desiredState");
  const planAreas = areas.filter((a) => a.domain_id);
  return (
    <main id="main" className="af-page">
      <FlowHeader
        title={t("title")}
        sub={t("sub")}
        segments={4}
        on={(i) => i === 3}
        close={
          <Link href="/plan" className="af-close td-hit" aria-label={t("close")}>
            <Icon src={icon("chevron_left")} />
          </Link>
        }
      />
      <div className="af-body is-review">
        <p className="pn-note mb-[18px] mt-[18.5px]">{t("intro")}</p>
        <ReviewTexts
          texts={[
            { name: "identity", label: ti("title"), hint: ti("hint"), placeholder: ti("placeholder"), value: plan.identity, action: saveIdentity },
            { name: "desiredState", label: td("planTitle"), hint: t("desiredHint"), placeholder: td("planPlaceholder"), value: plan.desired_state, action: saveDesiredState },
          ]}
        />

        <section aria-labelledby="review-domains" className="mt-[26px]">
          <div className="pn-section-head">
            <h2 id="review-domains">{t("domainsTitle", { count: planAreas.length, n: formatNumber(planAreas.length) })}</h2>
            <span className="pn-line" aria-hidden="true" />
          </div>
          {planAreas.length === 0 && <p className="pn-empty-row">{(await getTranslations("domainCard"))("noDomains")}</p>}
          {planAreas.map((a, i) => (
            <details key={a.id} className="pf-domain" open={i === 0}>
              <summary className="pf-domain-top">
                <span className="pf-num" aria-hidden="true">
                  {formatNumber(i + 1)}
                </span>
                <span className="pf-domain-name">{domains.find((d) => d.id === a.domain_id)?.name ?? a.title}</span>
                <Icon src={icon("keyboard_arrow_down")} />
              </summary>
              <DomainForm area={a} />
            </details>
          ))}
        </section>

        <section aria-labelledby="review-when" className="mt-[26px]">
          <div className="pn-section-head">
            <h2 id="review-when">{t("step3")}</h2>
            <span className="pn-line" aria-hidden="true" />
          </div>
          <PlanReviewSchedule today={today} titleId="review-when" />
        </section>
      </div>
    </main>
  );
}
