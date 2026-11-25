"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { Field } from "@/components/ui/Field";
import { resendEmailCode, verifyEmailCode } from "@/server/actions/onboarding";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";
import { authIcon } from "@/ui/icons-auth";
import { AuthHeader } from "./AuthHeader";
import { useErrorText } from "./useErrorText";

/**
 * The 6-digit code from the email (sign-up and sign-in). Accepts Arabic-Indic digits. Focus moves to
 * its heading when it replaces the form before it. `children` follow the card (the page's links).
 */
export function EmailCodeForm({
  identifier,
  isEmail,
  title,
  onBack,
  children,
}: {
  identifier: string;
  isEmail: boolean;
  title?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("emailCode");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(verifyEmailCode, null);
  const [resent, resend, resending] = useActionState(resendEmailCode, null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const failed = state && !state.ok ? state : null;
  return (
    <>
      <AuthHeader
        kicker={tc("appName")}
        title={title ?? t("title")}
        headingRef={heading}
        intro={isEmail ? t("intro", { email: identifier }) : t("introPhone")}
      />
      <div className="au-content">
        <form action={action} className="au-card au-form">
          <input type="hidden" name="identifier" value={identifier} />
          <Field
            name="token"
            label={t("code")}
            error={failed ? (failed.field === "token" ? t("wrongCode") : errorText(failed.error)) : undefined}
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            maxLength={6}
            className="au-code"
            required
          />
          <div className="au-actions">
            <button type="submit" disabled={pending} className="af-next">
              <Icon src={authIcon("mark_email_read")} />
              {t("verify")}
            </button>
            {onBack && (
              <button type="button" className="au-alt" onClick={onBack}>
                <Icon src={icon("chevron_right")} />
                {t("back")}
              </button>
            )}
          </div>
        </form>
        <form action={resend} className="au-aside">
          <input type="hidden" name="identifier" value={identifier} />
          <p>{t("missing")}</p>
          <button type="submit" disabled={resending} className="au-text-btn">
            {t("resend")}
          </button>
          <p role="status" className="au-status">
            {resent?.ok ? t("resent") : ""}
            {resent && !resent.ok && (
              <span className="text-dawn-700">
                {errorText(resent.error)} {resent.detail && <span dir="ltr" className="text-xs">({resent.detail})</span>}
              </span>
            )}
          </p>
        </form>
        {children}
      </div>
    </>
  );
}
