"use client";

import { useTranslations } from "next-intl";
import { isOn, WEEK_ORDER } from "@/lib/days";
import { FieldLabel } from "./FieldLabel";

/**
 * «أيام التكرار» (data-model.md habits.days): seven toggle buttons, Saturday first, at least one on.
 * Each shows the day's letter as designed and is named by the day.
 */
export function DaysPicker({ value, onChange, disabled = false }: { value: number; onChange: (mask: number) => void; disabled?: boolean }) {
  const t = useTranslations("addFlow");
  const tw = useTranslations("weekdays");
  const ts = useTranslations("weekdaysShort");
  const tl = useTranslations("weekdaysLetter");
  return (
    <fieldset aria-describedby="days-hint">
      <FieldLabel as="legend" text={t("days")} plain />
      <div className="days">
        {WEEK_ORDER.map((d) => {
          const on = isOn(value, d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={ts(String(d) as "0")}
              title={tw(String(d) as "0")}
              disabled={disabled}
              onClick={() => {
                const next = value ^ (1 << d);
                if (next !== 0) onChange(next);
              }}
            >
              {tl(String(d) as "0")}
            </button>
          );
        })}
      </div>
      <p id="days-hint" className="af-hint">
        {t("daysHint")}
      </p>
    </fieldset>
  );
}
