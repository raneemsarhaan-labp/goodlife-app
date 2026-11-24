"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { signIn } from "@/server/actions/onboarding";
import { EmailCodeForm } from "./EmailCodeForm";
import { useErrorText } from "./useErrorText";

/** Email or mobile + password. An unconfirmed email is asked for its code. */
export function SignInForm() {
  const t = useTranslations("signIn");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signIn, null);
  const [editing, setEditing] = useState(false);
  const onSubmit = useKeepValuesSubmit(action, () => setEditing(false));

  if (state?.ok && !editing) return <EmailCodeForm email={state.data.confirmEmail} onBack={() => setEditing(true)} />;

  const failed = state && !state.ok ? state : null;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Field
        name="identifier"
        label={t("identifier")}
        hint={t("identifierHint")}
        autoComplete="username"
        dir="ltr"
        error={failed?.field === "identifier" ? t("identifierInvalid") : undefined}
        required
      />
      <PasswordField name="password" label={t("password")} autoComplete="current-password" required />
      {failed && failed.field !== "identifier" && (
        <p role="alert" className="text-dawn-700">
          {failed.field === "password" ? t("wrongCredentials") : errorText(failed.error)}
          {failed.detail && <span dir="ltr" className="ms-2 text-xs text-ink-500">({failed.detail})</span>}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
      <p className="text-center text-sm text-ink-700">{t("forgot")}</p>
    </form>
  );
}
