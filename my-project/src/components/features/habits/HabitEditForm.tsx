"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AMOUNT_MAX, fromMask, type TimeOfDay } from "@/lib/days";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { updateHabit } from "@/server/actions/habits";
import { DaysPicker } from "./DaysPicker";
import { HabitIconPicker } from "./HabitIconPicker";
import { TimeOfDayPicker } from "./TimeOfDayPicker";

export function HabitEditForm({
  habit,
  areas,
  domains,
}: {
  habit: {
    id: string;
    name: string;
    description: string | null;
    focus_area_id: string | null;
    icon?: string | null;
    domain_id?: string | null;
    amount?: string | null;
    time_of_day?: TimeOfDay;
    days?: number;
  };
  areas: { id: string; title: string }[];
  domains: { id: string; name: string }[];
}) {
  const t = useTranslations("habits");
  const ta = useTranslations("admin");
  const tf = useTranslations("addFlow");
  const [time, setTime] = useState<TimeOfDay>(habit.time_of_day ?? "any");
  const [days, setDays] = useState(habit.days ?? 127);
  return (
    <ActionForm action={updateHabit} submitLabel={t("save")} successText={ta("saved")}>
      <input type="hidden" name="id" value={habit.id} />
      <Field name="name" label={t("name")} defaultValue={habit.name} required maxLength={80} />
      <TextArea name="description" label={t("description")} defaultValue={habit.description ?? ""} maxLength={500} />
      <HabitIconPicker defaultValue={habit.icon} />
      <Select name="domainId" label={t("domain")} defaultValue={habit.domain_id ?? ""}>
        <option value="">{t("noDomain")}</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
      <Field name="amount" label={tf("amount")} hint={tf("amountHint")} placeholder={tf("amountPlaceholder")} defaultValue={habit.amount ?? ""} maxLength={AMOUNT_MAX} />
      <TimeOfDayPicker value={time} onChange={setTime} />
      <input type="hidden" name="timeOfDay" value={time} />
      <DaysPicker value={days} onChange={setDays} />
      {fromMask(days).map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}
      <Select name="focusAreaId" label={t("focusArea")} defaultValue={habit.focus_area_id ?? ""}>
        <option value="">{t("noFocusArea")}</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </Select>
    </ActionForm>
  );
}
