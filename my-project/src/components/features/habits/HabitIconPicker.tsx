"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_HABIT_ICON, HABIT_ICONS } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";
import { Icon } from "@/ui/components/Icon";
import { FieldLabel } from "./FieldLabel";

/** Choose a habit's icon from the curated set (data-model.md habits.icon; spec 002 FR-022), drawn thin as in the habit circles. */
export function HabitIconPicker({ defaultValue }: { defaultValue?: string | null }) {
  const t = useTranslations("habits");
  const initial = defaultValue && (HABIT_ICONS as readonly string[]).includes(defaultValue) ? defaultValue : DEFAULT_HABIT_ICON;
  return (
    <fieldset aria-describedby="icon-hint">
      <FieldLabel as="legend" text={t("icon")} />
      <div className="he-icons">
        {HABIT_ICONS.map((name) => (
          <label key={name} className="he-icon">
            <input type="radio" name="icon" value={name} defaultChecked={name === initial} className="sr-only" aria-label={name.replaceAll("_", " ")} />
            <Icon src={habitIconThin(name)} />
          </label>
        ))}
      </div>
      <p id="icon-hint" className="af-hint">
        {t("iconHint")}
      </p>
    </fieldset>
  );
}
