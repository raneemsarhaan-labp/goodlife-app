"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { AMOUNT_MAX, fromMask, type TimeOfDay } from "@/lib/days";
import { archiveHabit, updateHabit } from "@/server/actions/habits";
import type { Result } from "@/server/actions/result";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";
import { flowIcon } from "@/ui/icons-flow";
import { DaysPicker } from "./DaysPicker";
import { FieldLabel } from "./FieldLabel";
import { FlowHeader } from "./FlowHeader";
import { HabitIconPicker } from "./HabitIconPicker";
import { readPrivateNames, savePrivateName } from "@/lib/private-habits";
import { SharingSwitches } from "./SharingSwitches";
import { TimeOfDayPicker } from "./TimeOfDayPicker";

/**
 * «تعديل العادة»: no screen of its own in the designs, so it is drawn with the habit flow's parts
 * (header, fields, time cards, days, privacy rows, footer button), with «أرشف العادة» at the end.
 */
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
  const te = useTranslations("errors");
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
  const [state, dispatch, pending] = useActionState(async (prev: Result<null> | null, fd: FormData) => {
    if (privacy.isPrivate) savePrivateName(habit.id, name);
    return updateHabit(prev, fd);
  }, null);
  const onSubmit = useKeepValuesSubmit(dispatch);

  return (
    <div className="af-page">
      <FlowHeader
        tall
        title={t("editTitle")}
        sub={t("editSub")}
        segments={3}
        on={() => true}
        close={
          <Link href="/plan" className="af-close td-hit" aria-label={t("close")}>
            <Icon src={icon("chevron_left")} />
          </Link>
        }
      />
      <form id="habit-edit" onSubmit={onSubmit} className="af-body">
        <input type="hidden" name="id" value={habit.id} />
        <FieldLabel as="label" htmlFor="habit-name" text={t("name")} />
        <div className="cf-field is-solo">
          <input id="habit-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} readOnly={locked} />
          <Icon src={icon("edit")} />
        </div>
        <FieldLabel as="label" htmlFor="habit-description" text={t("description")} />
        <div className="cf-field is-solo">
          <textarea id="habit-description" name="description" defaultValue={habit.description ?? ""} maxLength={500} rows={2} />
          <Icon src={flowIcon("reorder")} />
        </div>
        <HabitIconPicker defaultValue={habit.icon} />
        <FieldLabel as="label" htmlFor="habit-domain" text={t("domain")} />
        <select id="habit-domain" name="domainId" defaultValue={habit.domain_id ?? ""} className="he-select mb-[22px]">
          <option value="">{t("noDomain")}</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <FieldLabel as="label" htmlFor="habit-amount" text={tf("amountLabel")} optional={tf("optional")} />
        <div className="af-amount-field">
          <input id="habit-amount" name="amount" defaultValue={habit.amount ?? ""} maxLength={AMOUNT_MAX} placeholder={tf("amountPlaceholder")} aria-describedby="habit-amount-hint" readOnly={locked} />
          <span className="af-amount-icon" aria-hidden="true">
            <Icon src={flowIcon("speed")} />
          </span>
        </div>
        <p id="habit-amount-hint" className="af-hint">
          {tf("amountHint")}
        </p>
        <TimeOfDayPicker value={time} onChange={setTime} disabled={locked} />
        <input type="hidden" name="timeOfDay" value={time} />
        <DaysPicker value={days} onChange={setDays} disabled={locked} />
        {fromMask(days).map((d) => (
          <input key={d} type="hidden" name="days" value={d} />
        ))}
        <SharingSwitches shared={privacy.shared} isPrivate={privacy.isPrivate} onChange={setPrivacy} privateLocked={locked} />
        <FieldLabel as="label" htmlFor="habit-area" text={t("focusArea")} />
        <select id="habit-area" name="focusAreaId" defaultValue={habit.focus_area_id ?? ""} className="he-select">
          <option value="">{t("noFocusArea")}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        <div className="he-archive">
          <p>{t("archiveHint")}</p>
          <button type="submit" form="habit-archive">
            {t("archive")}
          </button>
        </div>
      </form>
      <div className="af-footer">
        {state && !state.ok && (
          <p role="alert" className="af-alert">
            {te(state.error)}
            {state.detail && (
              <span dir="ltr" className="ms-2 text-xs">
                ({state.detail})
              </span>
            )}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="af-status">
            {ta("saved")}
          </p>
        )}
        <button type="submit" form="habit-edit" disabled={pending} className="af-next">
          <Icon src={icon("eco")} />
          {t("save")}
        </button>
      </div>
      <form id="habit-archive" action={archiveHabit} hidden>
        <input type="hidden" name="id" value={habit.id} />
      </form>
    </div>
  );
}
