"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { requestSignInCode, verifySignInCode } from "@/server/actions/onboarding";
import { useErrorText } from "./useErrorText";

/** Enter the 6-digit code sent by email. Accepts Arabic-Indic digits. */
export function OtpForm({ email, next, onBack }: { email: string; next?: "welcome"; onBack?: () => void }) {
  const t = useTranslations("signIn");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifySignInCode, null);
  const [resent, resend, resending] = useActionState(requestSignInCode, null);
  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{t("codeTitle")}</h1>
        <p className="text-ink-700">{t("codeIntro", { email })}</p>
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          name="token"
          label={t("code")}
          error={state && !state.ok ? (state.error === "invalid_input" ? t("wrongCode") : errorText(state.error)) : undefined}
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
      </form>
      <form action={resend} className="flex flex-col items-center gap-2 text-center">
        <input type="hidden" name="email" value={email} />
        <p className="text-sm text-ink-700">{t("codeMissing")}</p>
        <Button type="submit" variant="quiet" disabled={resending}>
          {t("sendAgain")}
        </Button>
        <p role="status" className="text-sm text-sage-700">
          {resent?.ok ? t("sentAgain") : ""}
        </p>
      </form>
      {onBack && (
        <Button variant="quiet" onClick={onBack}>
          {t("resend")}
        </Button>
      )}
    </div>
  );
}
