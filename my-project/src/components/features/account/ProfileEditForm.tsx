"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { updateProfile } from "@/server/actions/account";

export function ProfileEditForm({ profile, zones }: { zones: string[]; profile: { full_name: string; email: string | null; phone: string | null; gender: "male" | "female" | null; city: string | null; time_zone: string } }) {
  const t = useTranslations("account");
  const tj = useTranslations("join");
  return (
    <ActionForm action={updateProfile} submitLabel={t("save")} successText={t("saved")}>
      <Field name="fullName" label={tj("fullName")} defaultValue={profile.full_name} required minLength={2} maxLength={80} />
      <Field name="phone" type="tel" dir="ltr" label={tj("phone")} hint={tj("phoneLocked")} defaultValue={profile.phone ?? ""} readOnly disabled />
      {profile.email && <Field name="email" label={tj("email")} defaultValue={profile.email} dir="ltr" readOnly disabled />}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 font-medium">{tj("gender")}</legend>
        {(["", "female", "male"] as const).map((value) => (
          <label key={value || "unset"} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="gender" value={value} defaultChecked={(profile.gender ?? "") === value} className="size-5 accent-sage-700" />
            {value === "" ? tj("genderUnset") : tj(value)}
          </label>
        ))}
      </fieldset>
      <Field name="city" label={tj("city")} defaultValue={profile.city ?? ""} maxLength={80} />
      <Field name="timeZone" label={t("timeZone")} hint={t("timeZoneHint")} defaultValue={profile.time_zone} list="time-zones" dir="ltr" required />
      <datalist id="time-zones">
        {zones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
    </ActionForm>
  );
}
