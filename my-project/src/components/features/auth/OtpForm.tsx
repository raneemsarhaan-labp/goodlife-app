"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { verifySignInCode } from "@/server/actions/onboarding";

/** Enter the 6-digit code sent by email. Accepts Arabic-Indic digits. */
export function OtpForm({ email, next, onBack }: { email: string; next?: "welcome"; onBack?: () => void }) {
  const t = useTranslations("signIn");
  const [state, action, pending] = useActionState(verifySignInCode, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("codeTitle")}</h1>
      <p className="text-ink-700">{t("codeIntro", { email })}</p>
      <input type="hidden" name="email" value={email} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field
        name="token"
        label={t("code")}
        error={state && !state.ok ? t("wrongCode") : undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        dir="ltr"
        maxLength={6}
        className="text-center text-2xl tracking-[0.5em]"
        required
      />
      <Button type="submit" disabled={pending}>
        {t("verify")}
      </Button>
      {onBack && (
        <Button variant="quiet" onClick={onBack}>
          {t("resend")}
        </Button>
      )}
    </form>
  );
}
