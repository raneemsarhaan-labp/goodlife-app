"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { requestSignInCode, signInWithPassword } from "@/server/actions/onboarding";
import { EmailCodeForm } from "./EmailCodeForm";
import { useErrorText } from "./useErrorText";

/** Email or mobile → a code by email. A password works too, for accounts that have one. */
export function SignInForm() {
  const t = useTranslations("signIn");
  const errorText = useErrorText();
  const [usePassword, setUsePassword] = useState(false);
  const [sent, send, sending] = useActionState(requestSignInCode, null);
  const [state, signIn, signingIn] = useActionState(signInWithPassword, null);
  const [editing, setEditing] = useState(false);
  const onSend = useKeepValuesSubmit(send, () => setEditing(false));
  const onPassword = useKeepValuesSubmit(signIn);

  if (!usePassword && sent?.ok && !editing) {
    return <EmailCodeForm identifier={sent.data.identifier} isEmail={sent.data.isEmail} title={t("codeTitle")} onBack={() => setEditing(true)} />;
  }

  const failed = usePassword ? (state && !state.ok ? state : null) : sent && !sent.ok ? sent : null;
  return (
    <form onSubmit={usePassword ? onPassword : onSend} className="flex flex-col gap-5" noValidate>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{usePassword ? t("introPassword") : t("intro")}</p>
      <Field
        name="identifier"
        label={t("identifier")}
        hint={t("identifierHint")}
        autoComplete="username"
        dir="ltr"
        error={failed?.field === "identifier" ? t("identifierInvalid") : undefined}
        required
      />
      {usePassword && <PasswordField name="password" label={t("password")} autoComplete="current-password" required />}
      {failed && failed.field !== "identifier" && (
        <p role="alert" className="text-dawn-700">
          {failed.field === "password" ? t("wrongCredentials") : errorText(failed.error)}
          {failed.detail && <span dir="ltr" className="ms-2 text-xs text-ink-500">({failed.detail})</span>}
        </p>
      )}
      <Button type="submit" disabled={usePassword ? signingIn : sending}>
        {usePassword ? t("submit") : t("sendCode")}
      </Button>
      <Button variant="quiet" onClick={() => setUsePassword((v) => !v)}>
        {usePassword ? t("useCode") : t("usePassword")}
      </Button>
    </form>
  );
}
