"use client";

import { useTranslations } from "next-intl";

/**
 * «الخصوصيّة» (spec 007 FR-001, FR-006): share with the group (peers see name and today's state), or a
 * private habit whose name stays on this device. The two exclude each other.
 */
export function SharingSwitches({
  shared,
  isPrivate,
  onChange,
  privateLocked = false,
}: {
  shared: boolean;
  isPrivate: boolean;
  onChange: (next: { shared: boolean; isPrivate: boolean }) => void;
  privateLocked?: boolean;
}) {
  const t = useTranslations("privateHabit");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-medium">{t("privacyTitle")}</legend>
      <label className="flex min-h-11 items-start gap-3 rounded-2xl bg-sage-50 p-3">
        <input
          type="checkbox"
          name="shared"
          checked={shared}
          disabled={isPrivate}
          onChange={(e) => onChange({ shared: e.target.checked, isPrivate: false })}
          aria-describedby="share-hint"
          className="mt-1 size-5 accent-sage-700"
        />
        <span className="flex flex-col">
          <span className="font-medium text-ink-900">{t("shareLabel")}</span>
          <span id="share-hint" className="text-sm text-ink-700">{t("shareHint")}</span>
        </span>
      </label>
      <label className="flex min-h-11 items-start gap-3 rounded-2xl bg-sand-100 p-3">
        <input
          type="checkbox"
          name="isPrivate"
          checked={isPrivate}
          disabled={privateLocked}
          onChange={(e) => onChange({ shared: false, isPrivate: e.target.checked })}
          aria-describedby="private-hint"
          className="mt-1 size-5 accent-sage-700"
        />
        <span className="flex flex-col">
          <span className="font-medium text-ink-900">{t("privateLabel")}</span>
          <span id="private-hint" className="text-sm text-ink-700">{t("privateHint")}</span>
        </span>
      </label>
    </fieldset>
  );
}
