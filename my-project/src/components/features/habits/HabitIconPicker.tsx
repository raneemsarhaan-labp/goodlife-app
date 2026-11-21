"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_HABIT_ICON, HABIT_ICONS, habitIcon } from "@/ui/icons";

/** Choose a habit's icon from the curated set (data-model.md habits.icon; spec 002 FR-022). */
export function HabitIconPicker({ defaultValue }: { defaultValue?: string | null }) {
  const t = useTranslations("habits");
  const initial = defaultValue && (HABIT_ICONS as readonly string[]).includes(defaultValue) ? defaultValue : DEFAULT_HABIT_ICON;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{t("icon")}</legend>
      <p className="text-sm text-ink-700">{t("iconHint")}</p>
      <div className="grid grid-cols-6 gap-2">
        {HABIT_ICONS.map((name) => (
          <label key={name} className="relative flex aspect-square min-h-11 cursor-pointer items-center justify-center rounded-full bg-sage-50 ring-1 ring-sand-200 has-[:checked]:bg-gold-100 has-[:checked]:ring-2 has-[:checked]:ring-dawn-700 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-dawn-700">
            <input type="radio" name="icon" value={name} defaultChecked={name === initial} className="sr-only" aria-label={name.replaceAll("_", " ")} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={habitIcon(name)} alt="" aria-hidden="true" width={24} height={24} className="size-6" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
