"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { COUNTRIES, countryForZone, DEFAULT_COUNTRY } from "@/lib/countries";

/**
 * Mobile number: a country (preselected from the device's time zone) and the number. Submits
 * `country` (calling code) and `phone`; the server joins them (composePhone).
 */
export function PhoneField({ label, hint, error, autoComplete = "tel-national" }: { label: string; hint?: string; error?: string; autoComplete?: string }) {
  const id = useId();
  const t = useTranslations("common");
  const select = useRef<HTMLSelectElement>(null);
  // Preselect from the device's time zone after hydration (the server renders the default).
  useEffect(() => {
    if (select.current) select.current.value = countryForZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-ink-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      )}
      <div dir="ltr" className="flex gap-2">
        <select
          name="country"
          ref={select}
          defaultValue={DEFAULT_COUNTRY}
          aria-label={t("country")}
          autoComplete="tel-country-code"
          className="min-h-11 w-28 shrink-0 rounded-xl gl-surface px-2 text-base text-ink-900"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} aria-label={`${c.name} +${c.code}`}>
              {`${c.flag} +${c.code}`}
            </option>
          ))}
        </select>
        <input
          id={id}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 min-w-0 flex-1 rounded-xl gl-surface px-4 text-base text-ink-900 aria-invalid:border-dawn-700"
          required
        />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-dawn-700">
          {error}
        </p>
      )}
    </div>
  );
}
