"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AMOUNT_MAX, fromMask, type TimeOfDay } from "@/lib/days";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { updateHabit } from "@/server/actions/habits";
import type { Result } from "@/server/actions/result";
import { DaysPicker } from "./DaysPicker";
import { HabitIconPicker } from "./HabitIconPicker";
import { readPrivateNames, savePrivateName } from "@/lib/private-habits";
import { SharingSwitches } from "./SharingSwitches";
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
    shared_with_group?: boolean;
    is_private?: boolean;
    group_challenge_id?: string | null;
  };
  areas: { id: string; title: string }[];
  domains: { id: string; name: string }[];
}) {
  const t = useTranslations("habits");
  const ta = useTranslations("admin");
  const tf = useTranslations("addFlow");
  const [time, setTime] = useState<TimeOfDay>(habit.time_of_day ?? "any");
  const [days, setDays] = useState(habit.days ?? 127);
  const [privacy, setPrivacy] = useState({ shared: Boolean(habit.shared_with_group), isPrivate: Boolean(habit.is_private) });
  // A private habit's real name is on this device only (spec 007 US4).
  const [name, setName] = useState(habit.name);
  useEffect(() => {
    if (!habit.is_private) return;
    const t = window.setTimeout(() => setName(readPrivateNames()[habit.id] ?? habit.name), 0);
    return () => window.clearTimeout(t);
  }, [habit.id, habit.is_private, habit.name]);
  const locked = Boolean(habit.group_challenge_id);
  return (
    <ActionForm
      action={async (prev: Result<null> | null, fd: FormData) => {
        if (privacy.isPrivate) savePrivateName(habit.id, name);
        return updateHabit(prev, fd);
      }}
      submitLabel={t("save")}
      successText={ta("saved")}
    >
      <input type="hidden" name="id" value={habit.id} />
      <Field name="name" label={t("name")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} readOnly={locked} />
      <TextArea name="description" label={t("description")} defaultValue={habit.description ?? ""} maxLength={500} />
      <HabitIconPicker defaultValue={habit.icon} />
      <Select name="domainId" label={t("domain")} defaultValue={habit.domain_id ?? ""}>
        <option value="">{t("noDomain")}</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
      <Field name="amount" label={tf("amount")} hint={tf("amountHint")} placeholder={tf("amountPlaceholder")} defaultValue={habit.amount ?? ""} maxLength={AMOUNT_MAX} readOnly={locked} />
      <TimeOfDayPicker value={time} onChange={locked ? () => undefined : setTime} />
      <input type="hidden" name="timeOfDay" value={time} />
      <DaysPicker value={days} onChange={locked ? () => undefined : setDays} />
      <SharingSwitches shared={privacy.shared} isPrivate={privacy.isPrivate} onChange={setPrivacy} privateLocked={locked} />
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
