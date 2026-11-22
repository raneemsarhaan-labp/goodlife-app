"use client";

import { useTranslations } from "next-intl";
import { isOn, WEEK_ORDER } from "@/lib/days";

/** «أيام التكرار» (data-model.md habits.days): seven toggle buttons, Saturday first, at least one on. */
export function DaysPicker({ value, onChange }: { value: number; onChange: (mask: number) => void }) {
  const t = useTranslations("addFlow");
  const tw = useTranslations("weekdays");
  const ts = useTranslations("weekdaysShort");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{t("days")}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEK_ORDER.map((d) => {
          const on = isOn(value, d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              title={tw(String(d) as "0")}
              onClick={() => {
                const next = value ^ (1 << d);
                if (next !== 0) onChange(next);
              }}
              className={`min-h-11 min-w-11 flex-1 rounded-full px-2 text-sm font-semibold ${on ? "bg-sage-700 text-white" : "gl-surface text-ink-700 ring-1 ring-sand-200"}`}
            >
              {ts(String(d) as "0")}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-ink-700">{t("daysHint")}</p>
    </fieldset>
  );
}
