"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { VERSIONS, type UiVersion } from "@/ui/versions";

/**
 * Choose among the three versions (FR-002): a radio group of live mini-previews. Each preview
 * renders a small «يومك» card stack inside its own `data-ui` scope, so it shows the real tokens.
 */
export function VersionPicker({ name = "version", initial }: { name?: string; initial: UiVersion }) {
  const t = useTranslations("versions");
  const tt = useTranslations("today");
  const [value, setValue] = useState<UiVersion>(initial);
  const text = {
    journey: { name: t("journey.name"), description: t("journey.description") },
    glass: { name: t("glass.name"), description: t("glass.description") },
    fullGlass: { name: t("fullGlass.name"), description: t("fullGlass.description") },
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t("label")}</legend>
      {VERSIONS.map((v) => (
        <label
          key={v.id}
          className={`flex cursor-pointer items-stretch gap-4 rounded-[var(--radius-card)] border-2 bg-white/70 p-3 transition-colors ${
            value === v.id ? "border-dawn-700" : "border-transparent"
          }`}
        >
          <input type="radio" name={name} value={v.id} checked={value === v.id} onChange={() => setValue(v.id)} className="sr-only" />
          <div data-ui={v.id} aria-hidden="true" className="gl-preview relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--page-bg)", backgroundImage: "var(--page-image)", backgroundSize: "cover" }}>
            <div className="absolute inset-x-2 top-2 flex flex-col gap-1.5">
              <div className="gl-surface rounded-lg px-1.5 py-1 text-[0.55rem] font-semibold text-ink-900">{tt("pageTitle")}</div>
              <div className="gl-surface flex gap-1 rounded-lg p-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`size-4 rounded-full ${i === 0 ? "bg-gold-100 ring-1 ring-gold-500" : "bg-sage-100"}`} />
                ))}
              </div>
              <div className="gl-surface h-8 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1">
            <span className="text-lg font-semibold text-ink-900">{text[v.key].name}</span>
            <span className="text-sm text-ink-700">{text[v.key].description}</span>
            {value === v.id && <span className="text-sm font-semibold text-dawn-700">✓ {t("current")}</span>}
          </div>
        </label>
      ))}
    </fieldset>
  );
}
