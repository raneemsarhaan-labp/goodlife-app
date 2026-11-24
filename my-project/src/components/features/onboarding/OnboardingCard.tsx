import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { dismissOnboarding } from "@/server/actions/setup";
import { ONBOARDING_STEPS, type OnboardingStatus, type OnboardingStep } from "@/server/queries/onboarding";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

/** Where each first step is done. */
const HREF: Record<OnboardingStep, string> = {
  look: "/account/appearance",
  current_state: "/setup/state?from=today",
  desired_state: "/setup/desired?from=today",
  domains: "/setup/domains?from=today",
  habit: "/setup/habits?from=today",
  intention: "/day/start",
  closed_day: "/day/close",
};

const Mark = () => (
  <span aria-hidden="true" className="td-round td-step-mark">
    <Icon src={icon("check")} />
  </span>
);

/**
 * «خطوات البداية» on «يومك»: the first steps, each ticked once done and linking to where it is done,
 * until all are done (then a short «رحلتك بدأت») or the member hides it. Drawn in the «يومك» card
 * style (the habit detail's gold progress bar and day circles).
 */
export async function OnboardingCard({ status }: { status: OnboardingStatus }) {
  const t = await getTranslations("onboarding");
  const done = ONBOARDING_STEPS.filter((s) => status[s]).length;
  const total = ONBOARDING_STEPS.length;
  const nextStep = ONBOARDING_STEPS.find((s) => !status[s]);
  return (
    <section aria-labelledby="onboarding" className="td-card">
      <div className="td-card-head" style={{ alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <h2 id="onboarding" className="td-card-title">{nextStep ? t("title") : t("doneTitle")}</h2>
          <p className="td-frac" style={{ margin: 0 }}>{nextStep ? t("progress", { done: formatNumber(done), total: formatNumber(total) }) : t("doneBody")}</p>
        </div>
        <form action={dismissOnboarding}>
          <button type="submit" aria-label={t("hide")} title={t("hide")} className="td-round td-hit td-menu">
            <Icon src={icon("close")} />
          </button>
        </form>
      </div>
      <div aria-hidden="true" className="td-onboarding-bar">
        <span style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {nextStep && (
        <ol className="td-steps">
          {ONBOARDING_STEPS.map((s) => (
            <li key={s}>
              {status[s] ? (
                <span className="td-step is-done">
                  <Mark />
                  <span>{t(`steps.${s}`)}</span>
                </span>
              ) : (
                <Link href={HREF[s]} aria-current={s === nextStep ? "step" : undefined} className={`td-step ${s === nextStep ? "is-next" : ""}`}>
                  <Mark />
                  <span style={{ flex: 1 }}>{t(`steps.${s}`)}</span>
                  {s === nextStep && <span className="td-step-go">{t("start")}</span>}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
