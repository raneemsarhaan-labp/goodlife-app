"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { completeJoin } from "@/server/actions/onboarding";
import { OtpForm } from "./OtpForm";
import { useErrorText } from "./useErrorText";

export function ProfileForm() {
  const t = useTranslations("join");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(completeJoin, null);
  const onSubmit = useKeepValuesSubmit(action, (fd) => fd.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone));

  if (state?.ok) return <OtpForm email={state.data.email} next="welcome" />;

  const fieldError = (field: string) =>
    state && !state.ok && state.field === field
      ? field === "email" && state.error === "conflict"
        ? t("emailTaken")
        : errorText(state.error)
      : undefined;
  const formError = state && !state.ok && !state.field ? errorText(state.error) : undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field name="fullName" label={t("fullName")} autoComplete="name" error={fieldError("fullName")} required minLength={2} maxLength={80} />
      <Field name="email" type="email" label={t("email")} hint={t("emailHint")} autoComplete="email" dir="ltr" error={fieldError("email")} required />
      <Field name="phone" type="tel" label={t("phone")} hint={t("phoneHint")} autoComplete="tel" dir="ltr" error={fieldError("phone")} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 font-medium">{t("gender")}</legend>
        {(["", "female", "male"] as const).map((value) => (
          <label key={value || "unset"} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="gender" value={value} defaultChecked={value === ""} className="size-5 accent-sage-700" />
            {value === "" ? t("genderUnset") : t(value)}
          </label>
        ))}
      </fieldset>
      <Field name="city" label={t("city")} autoComplete="address-level2" error={fieldError("city")} maxLength={80} />
      {formError && (
        <p role="alert" className="text-dawn-700">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
