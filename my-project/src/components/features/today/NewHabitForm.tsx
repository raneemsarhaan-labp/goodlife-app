"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { createHabit } from "@/server/actions/habits";
import { HabitIconPicker } from "@/components/features/habits/HabitIconPicker";

export function NewHabitForm({
  areas = [],
  returnTo,
  defaultAreaId,
  prefill,
}: {
  areas?: { id: string; title: string }[];
  returnTo?: "plan";
  defaultAreaId?: string;
  /** «اجعلها عادة» (spec 003 FR-021, FR-022): name from today's challenge, and whether it already exists. */
  prefill?: { name: string; duplicate: boolean };
}) {
  const t = useTranslations("habits");
  const tm = useTranslations("makeHabit");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(createHabit, null);
  const onSubmit = useKeepValuesSubmit(action);
  const error = (field: string) => (state && !state.ok && state.field === field ? te(state.error) : undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {prefill && <p className="self-start rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-ink-900">{tm("fromChallenge")}</p>}
      <Field name="name" label={t("name")} hint={t("nameHint")} maxLength={80} error={error("name")} defaultValue={prefill?.name} required autoFocus />
      {prefill?.duplicate && (
        <p role="status" className="text-sm text-dawn-700">
          {tm("duplicate")}
        </p>
      )}
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
