"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { createHabit } from "@/server/actions/habits";
import { HabitIconPicker } from "@/components/features/habits/HabitIconPicker";

export function NewHabitForm({ areas = [], returnTo, defaultAreaId }: { areas?: { id: string; title: string }[]; returnTo?: "plan"; defaultAreaId?: string }) {
  const t = useTranslations("habits");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(createHabit, null);
  const onSubmit = useKeepValuesSubmit(action);
  const error = (field: string) => (state && !state.ok && state.field === field ? te(state.error) : undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field name="name" label={t("name")} hint={t("nameHint")} maxLength={80} error={error("name")} required autoFocus />
      <TextArea name="description" label={t("description")} maxLength={500} error={error("description")} />
      <HabitIconPicker />
      {areas.length > 0 && (
        <Select name="focusAreaId" label={t("focusArea")} defaultValue={defaultAreaId ?? ""}>
          <option value="">{t("noFocusArea")}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </Select>
      )}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {state && !state.ok && !state.field && <p role="alert" className="text-dawn-700">{te(state.error)}</p>}
      <Button type="submit" disabled={pending}>
        {t("create")}
      </Button>
    </form>
  );
}
