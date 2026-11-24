"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PhoneField } from "@/components/ui/PhoneField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { signUp } from "@/server/actions/onboarding";
import { EmailCodeForm } from "./EmailCodeForm";
import { useErrorText } from "./useErrorText";

/** New account: name, email, mobile, password (twice); then the code sent to the email. */
export function SignUpForm() {
  const t = useTranslations("join");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, null);
  const [editing, setEditing] = useState(false);
  const onSubmit = useKeepValuesSubmit(action, (fd) => {
    fd.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    setEditing(false);
  });

  if (state?.ok && !editing) return <EmailCodeForm email={state.data.email} onBack={() => setEditing(true)} />;

  const failed = state && !state.ok ? state : null;
  const fieldError = (name: string) => {
    if (!failed || failed.field !== name) return undefined;
    if (name === "email") return failed.error === "conflict" ? t("emailTaken") : t("emailInvalid");
    if (name === "phone") return failed.error === "conflict" ? t("phoneTaken") : t("phoneInvalid");
    if (name === "password") return t("passwordShort");
    if (name === "confirmPassword") return t("passwordMismatch");
    return errorText(failed.error);
  };
  const formError = failed && !failed.field ? errorText(failed.error) : undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field name="fullName" label={t("fullName")} autoComplete="name" error={fieldError("fullName")} required minLength={2} maxLength={80} />
      <Field name="email" type="email" label={t("email")} hint={t("emailHint")} autoComplete="email" dir="ltr" error={fieldError("email")} required />
      <PhoneField label={t("phone")} hint={t("phoneHint")} error={fieldError("phone")} />
      <PasswordField name="password" label={t("password")} hint={t("passwordHint")} autoComplete="new-password" error={fieldError("password")} required minLength={8} />
      <PasswordField name="confirmPassword" label={t("confirmPassword")} autoComplete="new-password" error={fieldError("confirmPassword")} required />
      {formError && (
        <p role="alert" className="text-dawn-700">
          {formError}
          {failed?.detail && <span dir="ltr" className="ms-2 text-xs text-ink-500">({failed.detail})</span>}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
