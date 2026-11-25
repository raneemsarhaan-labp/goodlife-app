"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { PhoneField } from "@/components/ui/PhoneField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { signUp } from "@/server/actions/onboarding";
import { AuthHeader } from "./AuthHeader";
import { EmailCodeForm } from "./EmailCodeForm";
import { useErrorText } from "./useErrorText";

/** New account: name, email, mobile; then the code sent to the email. `children` follow the card. */
export function SignUpForm({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("join");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signUp, null);
  const [editing, setEditing] = useState(false);
  const onSubmit = useKeepValuesSubmit(action, (fd) => {
    fd.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    setEditing(false);
  });

  if (state?.ok && !editing) {
    return (
      <EmailCodeForm identifier={state.data.identifier} isEmail onBack={() => setEditing(true)}>
        {children}
      </EmailCodeForm>
    );
  }

  const failed = state && !state.ok ? state : null;
  const fieldError = (name: string) => {
    if (!failed || failed.field !== name) return undefined;
    if (name === "email") return failed.error === "conflict" ? t("emailTaken") : t("emailInvalid");
    if (name === "phone") return failed.error === "conflict" ? t("phoneTaken") : t("phoneInvalid");
    return errorText(failed.error);
  };
  const formError = failed && !failed.field ? errorText(failed.error) : undefined;

  return (
    <>
      <AuthHeader kicker={tc("appName")} title={t("title")} intro={t("intro")} />
      <div className="au-content">
        <form onSubmit={onSubmit} className="au-card au-form" noValidate>
          <Field name="fullName" label={t("fullName")} autoComplete="name" error={fieldError("fullName")} required minLength={2} maxLength={80} />
          <Field name="email" type="email" label={t("email")} hint={t("emailHint")} autoComplete="email" dir="ltr" error={fieldError("email")} required />
          <PhoneField label={t("phone")} hint={t("phoneHint")} error={fieldError("phone")} />
          {formError && (
            <p role="alert" className="au-alert">
              {formError}
              {failed?.detail && <span dir="ltr" className="ms-2 text-xs font-normal text-ink-500">({failed.detail})</span>}
            </p>
          )}
          <button type="submit" disabled={pending} className="af-next">
            {t("submit")}
          </button>
        </form>
        {children}
      </div>
    </>
  );
}
