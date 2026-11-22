"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { formatDate, formatNumber } from "@/lib/format";
import { addDays, inOneMonth } from "@/lib/plan-review";
import { completePlanReview } from "@/server/actions/plan";

/**
 * «من أنت وما تريد» (spec 005 US3): reread and edit identity and desired state, then the domains, then
 * choose the next review. Earlier steps are server-rendered forms passed in; every step stays mounted so
 * nothing typed is lost when moving back and forth.
 */
export function PlanReviewStepper({ steps, today }: { steps: [ReactNode, ReactNode]; today: string }) {
  const t = useTranslations("planReview");
  const te = useTranslations("errors");
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<"month" | "other">("month");
  const [state, dispatch, pending] = useActionState(completePlanReview, null);
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(step);
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    heading.current?.focus();
  }, [step]);
  const month = inOneMonth(today);
  const titles = [
    [t("step1"), t("step1Hint")],
    [t("step2"), t("step2Hint")],
    [t("step3"), t("step3Hint")],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-sage-700">{t("stepOf", { n: formatNumber(step) })}</p>
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-dawn-700" : "bg-sand-200"}`} />
          ))}
        </div>
        <h2 ref={heading} tabIndex={-1} className="mt-2 text-xl font-semibold outline-none">{titles[step - 1]![0]}</h2>
        <p className="text-ink-700">{titles[step - 1]![1]}</p>
      </header>

      <div hidden={step !== 1} className="flex flex-col gap-5">{steps[0]}</div>
      <div hidden={step !== 2} className="flex flex-col gap-5">{steps[1]}</div>
      {step === 3 && (
        <form action={dispatch} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t("step3")}</legend>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl gl-surface px-4">
              <input type="radio" name="when" checked={choice === "month"} onChange={() => setChoice("month")} className="size-5 accent-sage-700" />
              {t("inMonth", { date: formatDate(month, { withWeekday: false }) })}
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl gl-surface px-4">
              <input type="radio" name="when" checked={choice === "other"} onChange={() => setChoice("other")} className="size-5 accent-sage-700" />
              {t("otherDate")}
            </label>
          </fieldset>
          {choice === "month" ? (
            <input type="hidden" name="nextReviewOn" value={month} />
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="font-medium">{t("pickDate")}</span>
              <input type="date" name="nextReviewOn" required min={addDays(today, 1)} max={addDays(today, 365)} className="gl-surface min-h-11 rounded-xl px-4" />
            </label>
          )}
          {state && !state.ok && (
            <p role="alert" className="text-sm text-dawn-700">{state.field === "nextReviewOn" || state.error === "invalid_input" ? t("dateInvalid") : te(state.error)}</p>
          )}
          <button type="submit" disabled={pending} className="min-h-12 rounded-full bg-dawn-700 px-6 font-medium text-white disabled:opacity-50">
            {t("save")}
          </button>
        </form>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="min-h-12 rounded-full px-6 font-medium text-sage-700 ring-1 ring-sage-600">
            {t("back")}
          </button>
        )}
        {step < 3 && (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="min-h-12 flex-1 rounded-full bg-dawn-700 px-6 font-medium text-white">
            {t("next")}
          </button>
        )}
      </div>
    </div>
  );
}
