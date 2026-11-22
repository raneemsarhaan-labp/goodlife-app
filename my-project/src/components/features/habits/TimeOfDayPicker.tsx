"use client";

import { useTranslations } from "next-intl";
import { TIMES_OF_DAY, type TimeOfDay } from "@/lib/days";
import { icon, type IconName } from "@/ui/icons";

const TIME_ICON: Record<TimeOfDay, IconName> = { morning: "wb_sunny", noon: "wb_sunny", evening: "bedtime", any: "schedule" };
const TIME_TINT: Record<TimeOfDay, string> = { morning: "bg-gold-100", noon: "bg-sage-100", evening: "bg-[oklch(93%_0.03_300)]", any: "bg-sand-100" };

/** «وقت اليوم» (data-model.md habits.time_of_day): four radio cards. */
export function TimeOfDayPicker({ value, onChange }: { value: TimeOfDay; onChange: (v: TimeOfDay) => void }) {
  const t = useTranslations("addFlow");
  const tt = useTranslations("times");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{t("timeOfDay")}</legend>
      <div className="grid grid-cols-4 gap-2">
        {TIMES_OF_DAY.map((k) => (
          <label key={k} className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl ${TIME_TINT[k]} ring-sand-200 has-[:checked]:ring-2 has-[:checked]:ring-dawn-700 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-dawn-700`}>
            <input type="radio" name="timeOfDayChoice" value={k} checked={value === k} onChange={() => onChange(k)} className="sr-only" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon(TIME_ICON[k])} alt="" aria-hidden="true" width={24} height={24} className="size-6" />
            <span className="text-sm font-semibold text-ink-900">{tt(k)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
