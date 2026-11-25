"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { requestSignInCode, signInWithPassword } from "@/server/actions/onboarding";
import { Icon } from "@/ui/components/Icon";
import { authIcon } from "@/ui/icons-auth";
import { AuthHeader } from "./AuthHeader";
import { EmailCodeForm } from "./EmailCodeForm";
import { useErrorText } from "./useErrorText";

/**
 * Email or mobile → a code by email. A password works too, for accounts that have one. `notice` sits
 * above the card (an expired link); `children` below it (the link to sign-up).
 */
export function SignInForm({ notice, children }: { notice?: React.ReactNode; children?: React.ReactNode }) {
  const t = useTranslations("signIn");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  const [usePassword, setUsePassword] = useState(false);
  const [sent, send, sending] = useActionState(requestSignInCode, null);
  const [state, signIn, signingIn] = useActionState(signInWithPassword, null);
  const [editing, setEditing] = useState(false);
  const onSend = useKeepValuesSubmit(send, () => setEditing(false));
  const onPassword = useKeepValuesSubmit(signIn);

  if (!usePassword && sent?.ok && !editing) {
    return (
      <EmailCodeForm identifier={sent.data.identifier} isEmail={sent.data.isEmail} title={t("codeTitle")} onBack={() => setEditing(true)}>
        {children}
      </EmailCodeForm>
    );
  }

  const failed = usePassword ? (state && !state.ok ? state : null) : sent && !sent.ok ? sent : null;
  return (
    <>
      <AuthHeader kicker={tc("appName")} title={t("title")} intro={usePassword ? t("introPassword") : t("intro")} />
      <div className="au-content">
        {notice}
        <form onSubmit={usePassword ? onPassword : onSend} className="au-card au-form" noValidate>
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
            <p role="alert" className="au-alert">
              {failed.field === "password" ? t("wrongCredentials") : errorText(failed.error)}
              {failed.detail && <span dir="ltr" className="ms-2 text-xs font-normal text-ink-500">({failed.detail})</span>}
            </p>
          )}
          <div className="au-actions">
            <button type="submit" disabled={usePassword ? signingIn : sending} className="af-next">
              {usePassword ? t("submit") : t("sendCode")}
            </button>
            <button type="button" className="au-alt" onClick={() => setUsePassword((v) => !v)}>
              <Icon src={authIcon(usePassword ? "mail" : "key")} />
              {usePassword ? t("useCode") : t("usePassword")}
            </button>
          </div>
        </form>
        {children}
      </div>
    </>
  );
}
