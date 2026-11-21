"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { setIntention } from "@/server/actions/today";

export function IntentionForm({ initial }: { initial: string }) {
  const t = useTranslations("startDay");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(setIntention, null);
  const onSubmit = useKeepValuesSubmit(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextArea
        name="intention"
        label={t("label")}
        placeholder={t("placeholder")}
        defaultValue={initial}
        maxLength={300}
        error={state && !state.ok ? te(state.error) : undefined}
        autoFocus
      />
      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
