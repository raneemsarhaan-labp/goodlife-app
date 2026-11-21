"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { createHabit } from "@/server/actions/habits";

export function NewHabitForm() {
  const t = useTranslations("habits");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(createHabit, null);
  const onSubmit = useKeepValuesSubmit(action);
  const error = (field: string) => (state && !state.ok && state.field === field ? te(state.error) : undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field name="name" label={t("name")} hint={t("nameHint")} maxLength={80} error={error("name")} required autoFocus />
      <TextArea name="description" label={t("description")} maxLength={500} error={error("description")} />
      {state && !state.ok && !state.field && <p role="alert" className="text-dawn-700">{te(state.error)}</p>}
      <Button type="submit" disabled={pending}>
        {t("create")}
      </Button>
    </form>
  );
}
