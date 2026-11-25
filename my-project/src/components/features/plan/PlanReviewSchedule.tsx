"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { formatDate } from "@/lib/format";
import { addDays, inOneMonth } from "@/lib/plan-review";
import { completePlanReview } from "@/server/actions/plan";

/**
 * «موعد المراجعة» (spec 005 US3): «بعد شهر» or «تاريخٌ آخر» as the designed option cards, then
 * «حفظ», which completes the review and returns to «خطتي».
 */
export function PlanReviewSchedule({ today, titleId }: { today: string; titleId: string }) {
  const t = useTranslations("planReview");
  const te = useTranslations("errors");
  const [choice, setChoice] = useState<"month" | "other">("month");
  const [state, dispatch, pending] = useActionState(completePlanReview, null);
  const month = inOneMonth(today);
  return (
    <form action={dispatch}>
      <fieldset className="review-options" aria-labelledby={titleId}>
        <label className="review-opt">
          <input type="radio" name="when" checked={choice === "month"} onChange={() => setChoice("month")} className="review-radio" />
          <span className="ro-title">{t("inMonthShort")}</span>
          <span className="ro-sub">{formatDate(month, { withWeekday: false })}</span>
        </label>
        <label className="review-opt">
          <input type="radio" name="when" checked={choice === "other"} onChange={() => setChoice("other")} className="review-radio" />
          <span className="ro-title">{t("otherDate")}</span>
        </label>
      </fieldset>
      {choice === "month" ? (
        <input type="hidden" name="nextReviewOn" value={month} />
      ) : (
        <>
          <label htmlFor="next-review" className="sr-only">
            {t("pickDate")}
          </label>
          <input id="next-review" type="date" name="nextReviewOn" required min={addDays(today, 1)} max={addDays(today, 365)} aria-describedby="next-review-hint" className="review-date" />
          <p id="next-review-hint" className="pn-note mt-2.5">
            {t("dateOrder")}
          </p>
        </>
      )}
      <p className="pn-note mt-2.5">{t("whenHint")}</p>
      {state && !state.ok && (
        <p role="alert" className="af-alert mt-3">
          {state.field === "nextReviewOn" || state.error === "invalid_input" ? t("dateInvalid") : te(state.error)}
        </p>
      )}
      <button type="submit" disabled={pending} className="pf-save-btn">
        {t("saveShort")}
      </button>
    </form>
  );
}
