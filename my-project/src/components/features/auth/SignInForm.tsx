"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { PhoneField } from "@/components/ui/PhoneField";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { signIn } from "@/server/actions/onboarding";
import { useErrorText } from "./useErrorText";

/** Mobile + password. */
export function SignInForm() {
  const t = useTranslations("signIn");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(signIn, null);
  const onSubmit = useKeepValuesSubmit(action);
  const failed = state && !state.ok ? state : null;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <PhoneField label={t("phone")} error={failed?.field === "phone" ? t("phoneInvalid") : undefined} />
      <PasswordField name="password" label={t("password")} autoComplete="current-password" required />
      {failed && failed.field !== "phone" && (
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
