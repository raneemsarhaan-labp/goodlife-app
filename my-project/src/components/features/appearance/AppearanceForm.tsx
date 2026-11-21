"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { setAppearance } from "@/server/actions/appearance";
import { VersionPicker } from "@/ui/components/VersionPicker";
import type { UiVersion } from "@/ui/versions";

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 items-start gap-3">
      <input type="hidden" name={`${name}Field`} value="1" />
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-5 accent-dawn-700" />
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-ink-700">{hint}</span>
      </span>
    </label>
  );
}

/** «المظهر» in «حسابي» (spec 002 US3, FR-004, FR-032, research §5). */
export function AppearanceForm({ version, ritual, reduceTransparency }: { version: UiVersion; ritual: boolean; reduceTransparency: boolean }) {
  const t = useTranslations("appearance");
  return (
    <ActionForm action={setAppearance} submitLabel={t("save")} successText={t("saved")} className="flex flex-col gap-5">
      <VersionPicker initial={version} />
      <Toggle name="ritual" label={t("ritual")} hint={t("ritualHint")} defaultChecked={ritual} />
      <Toggle name="reduceTransparency" label={t("reduceTransparency")} hint={t("reduceTransparencyHint")} defaultChecked={reduceTransparency} />
    </ActionForm>
  );
}
