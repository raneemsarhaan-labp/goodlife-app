"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { requestSignInCode } from "@/server/actions/onboarding";
import { OtpForm } from "./OtpForm";
import { useErrorText } from "./useErrorText";

export function SignInForm() {
  const t = useTranslations("signIn");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(requestSignInCode, null);
  const [restart, setRestart] = useState(0);
  const onSubmit = useKeepValuesSubmit(action, () => setRestart(0));

  if (state?.ok && restart === 0) {
    return <OtpForm email={state.data.email} onBack={() => setRestart((n) => n + 1)} />;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <Field
        name="email"
        type="email"
        label={t("email")}
        autoComplete="email"
        dir="ltr"
        error={state && !state.ok ? errorText(state.error) : undefined}
        required
      />
      <Button type="submit" disabled={pending}>
        {t("sendCode")}
      </Button>
    </form>
  );
}
