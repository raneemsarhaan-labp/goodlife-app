"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { resendEmailCode, verifyEmailCode } from "@/server/actions/onboarding";
import { useErrorText } from "./useErrorText";

/** The 6-digit code from the email (sign-up and sign-in). Accepts Arabic-Indic digits. */
export function EmailCodeForm({ identifier, isEmail, title, onBack }: { identifier: string; isEmail: boolean; title?: string; onBack?: () => void }) {
  const t = useTranslations("emailCode");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyEmailCode, null);
  const [resent, resend, resending] = useActionState(resendEmailCode, null);
  const failed = state && !state.ok ? state : null;
  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{title ?? t("title")}</h1>
        <p className="text-ink-700">{isEmail ? t("intro", { email: identifier }) : t("introPhone")}</p>
        <input type="hidden" name="identifier" value={identifier} />
        <Field
          name="token"
          label={t("code")}
          error={failed ? (failed.field === "token" ? t("wrongCode") : errorText(failed.error)) : undefined}
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
        <input type="hidden" name="identifier" value={identifier} />
        <p className="text-sm text-ink-700">{t("missing")}</p>
        <Button type="submit" variant="quiet" disabled={resending}>
          {t("resend")}
        </Button>
        <p role="status" className="text-sm text-sage-700">
          {resent?.ok ? t("resent") : ""}
          {resent && !resent.ok && (
            <span className="text-dawn-700">
              {errorText(resent.error)} {resent.detail && <span dir="ltr" className="text-xs">({resent.detail})</span>}
            </span>
          )}
        </p>
      </form>
      {onBack && (
        <Button variant="quiet" onClick={onBack}>
          {t("back")}
        </Button>
      )}
    </div>
  );
}
