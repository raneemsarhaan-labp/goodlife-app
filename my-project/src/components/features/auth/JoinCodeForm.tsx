"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { checkInvitation } from "@/server/actions/onboarding";
import { useErrorText } from "./useErrorText";

export function JoinCodeForm() {
  const t = useTranslations("join");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(checkInvitation, null);
  const onSubmit = useKeepValuesSubmit(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        name="code"
        label={t("codeLabel")}
        hint={t("codeHint")}
        error={state && !state.ok ? errorText(state.error) : undefined}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        dir="ltr"
        className="text-center text-xl tracking-[0.3em]"
        required
      />
      <Button type="submit" disabled={pending}>
        {t("check")}
      </Button>
    </form>
  );
}
