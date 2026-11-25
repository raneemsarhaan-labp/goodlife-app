"use client";

import { useTranslations } from "next-intl";
import { TIMES_OF_DAY, type TimeOfDay } from "@/lib/days";
import { icon } from "@/ui/icons";
import { TIME_ICONS_THIN_BY_TIME } from "@/ui/icons-thin";
import { Icon } from "@/ui/components/Icon";
import { FieldLabel } from "./FieldLabel";

/** «وقت اليوم» (data-model.md habits.time_of_day): the designed four tinted cards with a check badge. */
export function TimeOfDayPicker({ value, onChange, disabled = false }: { value: TimeOfDay; onChange: (v: TimeOfDay) => void; disabled?: boolean }) {
  const t = useTranslations("addFlow");
  const tt = useTranslations("times");
  return (
    <fieldset disabled={disabled}>
      <FieldLabel as="legend" text={t("timeOfDayLabel")} optional={t("optional")} />
      <div className="time-grid">
        {TIMES_OF_DAY.map((k) => (
          <label key={k} className={`time-card tc-${k}`}>
            <input type="radio" name="timeOfDayChoice" value={k} checked={value === k} onChange={() => onChange(k)} className="sr-only" />
            <span className="tc-check" aria-hidden="true">
              <Icon src={icon("check")} />
            </span>
            <Icon src={TIME_ICONS_THIN_BY_TIME[k]} />
            <span className="tc-lbl">{tt(k)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
