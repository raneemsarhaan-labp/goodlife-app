"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { updateHabit } from "@/server/actions/habits";
import { HabitIconPicker } from "./HabitIconPicker";

export function HabitEditForm({
  habit,
  areas,
}: {
  habit: { id: string; name: string; description: string | null; focus_area_id: string | null; icon?: string | null };
  areas: { id: string; title: string }[];
}) {
  const t = useTranslations("habits");
  const ta = useTranslations("admin");
  return (
    <ActionForm action={updateHabit} submitLabel={t("save")} successText={ta("saved")}>
      <input type="hidden" name="id" value={habit.id} />
      <Field name="name" label={t("name")} defaultValue={habit.name} required maxLength={80} />
      <TextArea name="description" label={t("description")} defaultValue={habit.description ?? ""} maxLength={500} />
      <HabitIconPicker defaultValue={habit.icon} />
      <Select name="focusAreaId" label={t("focusArea")} defaultValue={habit.focus_area_id ?? ""}>
        <option value="">{t("noFocusArea")}</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </Select>
    </ActionForm>
  );
}
