"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PhoneField } from "@/components/ui/PhoneField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { signUp } from "@/server/actions/onboarding";
import { useErrorText } from "./useErrorText";

/** New account: name, mobile, password (twice). */
export function SignUpForm() {
  const t = useTranslations("join");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, null);
  const onSubmit = useKeepValuesSubmit(action, (fd) => fd.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone));

  const failed = state && !state.ok ? state : null;
  const fieldError = (name: string) => {
    if (!failed || failed.field !== name) return undefined;
    if (name === "phone") return failed.error === "conflict" ? t("phoneTaken") : t("phoneInvalid");
    if (name === "password") return t("passwordShort");
    if (name === "confirmPassword") return t("passwordMismatch");
    return errorText(failed.error);
  };
  const formError = failed && !failed.field ? errorText(failed.error) : undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field name="fullName" label={t("fullName")} autoComplete="name" error={fieldError("fullName")} required minLength={2} maxLength={80} />
      <PhoneField label={t("phone")} hint={t("phoneHint")} error={fieldError("phone")} />
      <PasswordField name="password" label={t("password")} hint={t("passwordHint")} autoComplete="new-password" error={fieldError("password")} required minLength={8} />
      <PasswordField name="confirmPassword" label={t("confirmPassword")} autoComplete="new-password" error={fieldError("confirmPassword")} required />
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
