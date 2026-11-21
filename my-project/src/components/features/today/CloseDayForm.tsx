"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { Button, buttonClass } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { closeDay } from "@/server/actions/today";

export function CloseDayForm() {
  const t = useTranslations("closeDay");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(closeDay, null);
  const onSubmit = useKeepValuesSubmit(action);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <p role="status" className="text-xl leading-loose text-sage-700">
          {state.data.closingMessage ?? t("fallbackMessage")}
        </p>
        <Link href="/" className={buttonClass("primary")}>
          {t("backToToday")}
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextArea
        name="reflection"
        label={t("reflection")}
        placeholder={t("reflectionPlaceholder")}
        maxLength={1000}
        error={state && !state.ok ? te(state.error) : undefined}
      />
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
