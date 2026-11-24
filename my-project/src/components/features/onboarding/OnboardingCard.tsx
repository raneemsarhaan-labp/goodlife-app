import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import { dismissOnboarding } from "@/server/actions/setup";
import { ONBOARDING_STEPS, type OnboardingStatus, type OnboardingStep } from "@/server/queries/onboarding";
import { icon } from "@/ui/icons";

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

const Mark = ({ done }: { done: boolean }) => (
  <span
    aria-hidden="true"
    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-sage-700" : "ring-2 ring-sand-200"}`}
  >
    {done && (
      <span className="size-4 bg-white" style={{ maskImage: `url("${icon("check")}")`, WebkitMaskImage: `url("${icon("check")}")`, maskSize: "contain", WebkitMaskSize: "contain" }} />
    )}
  </span>
);

/**
 * «خطوات البداية» on «يومك»: the first steps, each ticked once done and linking to where it is done,
 * until all are done (then a short «رحلتك بدأت») or the member hides it.
 */
export async function OnboardingCard({ status }: { status: OnboardingStatus }) {
  const t = await getTranslations("onboarding");
  const done = ONBOARDING_STEPS.filter((s) => status[s]).length;
  const total = ONBOARDING_STEPS.length;
  const nextStep = ONBOARDING_STEPS.find((s) => !status[s]);
  return (
    <Card aria-labelledby="onboarding" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle id="onboarding">{nextStep ? t("title") : t("doneTitle")}</CardTitle>
          <p className="text-sm text-ink-700">{nextStep ? t("progress", { done: formatNumber(done), total: formatNumber(total) }) : t("doneBody")}</p>
        </div>
        <form action={dismissOnboarding}>
          <button type="submit" aria-label={t("hide")} className="flex size-11 items-center justify-center rounded-full text-ink-700 hover:bg-sand-100">
            <span aria-hidden="true" className="size-5 bg-current" style={{ maskImage: `url("${icon("close")}")`, WebkitMaskImage: `url("${icon("close")}")`, maskSize: "contain", WebkitMaskSize: "contain" }} />
          </button>
        </form>
      </div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sand-100">
        <div className="h-full rounded-full bg-sage-700" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {nextStep && (
        <ol className="flex flex-col gap-1">
          {ONBOARDING_STEPS.map((s) => (
            <li key={s}>
              {status[s] ? (
                <span className="flex min-h-11 items-center gap-3 text-ink-500 line-through decoration-sand-200">
                  <Mark done />
                  <span>{t(`steps.${s}`)}</span>
                </span>
              ) : (
                <Link
                  href={HREF[s]}
                  aria-current={s === nextStep ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-2 -mx-2 ${s === nextStep ? "bg-dawn-50 font-semibold text-ink-900" : "text-ink-900"}`}
                >
                  <Mark done={false} />
                  <span className="flex-1">{t(`steps.${s}`)}</span>
                  {s === nextStep && <span className="text-sm text-dawn-700">{t("start")}</span>}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
