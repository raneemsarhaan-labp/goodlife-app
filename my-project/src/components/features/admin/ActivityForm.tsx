"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { MAX_SESSIONS } from "@/lib/limits";
import { saveActivity } from "@/server/actions/activities";

export type ActivityDraft = {
  id?: string;
  title?: string;
  description?: string | null;
  sessions?: { startsAt: string; endsAt: string }[];
  location?: string | null;
  groupIds?: string[];
  cohortId?: string | null;
  registrationOpen?: boolean;
  capacity?: number | null;
  mode?: "in_person" | "online";
  meetingUrl?: string;
  presenter?: string | null;
};

type SessionRow = { key: number; startsAt: string; endsAt: string };

/**
 * Schedule or edit an activity. Admins may target a whole cohort or groups; facilitators
 * (allowCohort=false) only the groups they lead.
 */
export function ActivityForm({
  draft = {},
  groups,
  cohorts,
  allowCohort,
  timeZone,
}: {
  draft?: ActivityDraft;
  groups: { id: string; label: string }[];
  cohorts: { id: string; name: string }[];
  allowCohort: boolean;
  timeZone: string;
}) {
  const t = useTranslations("admin.activities");
  const ts = useTranslations("admin");
  const [audience, setAudience] = useState<"groups" | "cohort">(draft.cohortId && allowCohort ? "cohort" : "groups");
  const [mode, setMode] = useState<"in_person" | "online">(draft.mode ?? "in_person");
  const [registration, setRegistration] = useState(Boolean(draft.registrationOpen));
  const [sessions, setSessions] = useState<SessionRow[]>(() =>
    (draft.sessions?.length ? draft.sessions : [{ startsAt: "", endsAt: "" }]).map((s, i) => ({ key: i, ...s })),
  );
  const update = (key: number, field: "startsAt" | "endsAt", value: string) =>
    setSessions((list) => list.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  return (
    <ActionForm action={saveActivity} submitLabel={t("save")} successText={ts("saved")} resetOnSuccess={!draft.id}>
      {draft.id && <input type="hidden" name="id" value={draft.id} />}
      <Field name="title" label={t("fieldTitle")} defaultValue={draft.title} required minLength={2} maxLength={120} />
      <TextArea name="description" label={t("description")} defaultValue={draft.description ?? ""} maxLength={2000} />
      <Field name="presenter" label={t("presenter")} defaultValue={draft.presenter ?? ""} maxLength={120} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-medium">{t("sessionsTitle")}</legend>
        <p className="text-sm text-ink-500">{t("sessionsHint")} {t("timeZoneNote", { tz: timeZone })}</p>
        <ol className="flex flex-col gap-3">
          {sessions.map((s, i) => (
            <li key={s.key} className="flex flex-col gap-2 rounded-xl border border-sand-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t("sessionNumber", { number: i + 1 })}</span>
                {sessions.length > 1 && (
                  <button type="button" onClick={() => setSessions((list) => list.filter((x) => x.key !== s.key))} className="min-h-11 px-2 text-sm text-dawn-700 underline underline-offset-4">
                    {t("removeSession", { number: i + 1 })}
                  </button>
                )}
              </div>
              <Field name="sessionStarts" type="datetime-local" label={t("startsAt")} value={s.startsAt} onChange={(e) => update(s.key, "startsAt", e.target.value)} required />
              <Field name="sessionEnds" type="datetime-local" label={t("endsAt")} value={s.endsAt} onChange={(e) => update(s.key, "endsAt", e.target.value)} />
            </li>
          ))}
        </ol>
        {sessions.length < MAX_SESSIONS && (
          <button
            type="button"
            onClick={() => setSessions((list) => [...list, { key: Math.max(...list.map((x) => x.key)) + 1, startsAt: "", endsAt: "" }])}
            className="min-h-11 self-start rounded-full px-4 text-sage-700 ring-1 ring-sage-600"
          >
            {t("addSession")}
          </button>
        )}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t("modeLabel")}</legend>
        {(["in_person", "online"] as const).map((m) => (
          <label key={m} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="size-5 accent-sage-700" />
            {t(m === "online" ? "modeOnline" : "modeInPerson")}
          </label>
        ))}
      </fieldset>
      {mode === "online" ? (
        <Field name="meetingUrl" type="url" dir="ltr" label={t("meetingUrl")} defaultValue={draft.meetingUrl ?? ""} placeholder="https://" maxLength={500} />
      ) : (
        <Field name="location" label={t("location")} defaultValue={draft.location ?? ""} maxLength={300} />
      )}
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="registrationOpen" checked={registration} onChange={(e) => setRegistration(e.target.checked)} className="size-5 accent-sage-700" />
        {t("registrationOpen")}
      </label>
      {registration && (
        <Field name="capacity" type="number" inputMode="numeric" min={1} max={1000} label={t("capacity")} defaultValue={draft.capacity ?? ""} />
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t("audience")}</legend>
        <label className="flex min-h-11 items-center gap-3">
          <input type="radio" name="audience" value="groups" checked={audience === "groups"} onChange={() => setAudience("groups")} className="size-5 accent-sage-700" />
          {t("audienceGroups")}
        </label>
        {allowCohort && (
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="audience" value="cohort" checked={audience === "cohort"} onChange={() => setAudience("cohort")} className="size-5 accent-sage-700" />
            {t("audienceCohort")}
          </label>
        )}
      </fieldset>
      {audience === "groups" ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-medium">{t("chooseGroups")}</legend>
          {groups.map((g) => (
            <label key={g.id} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" name="groupIds" value={g.id} defaultChecked={draft.groupIds?.includes(g.id)} className="size-5 accent-sage-700" />
              {g.label}
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cohortId" className="font-medium">{t("chooseCohort")}</label>
          <select id="cohortId" name="cohortId" defaultValue={draft.cohortId ?? undefined} className="min-h-11 rounded-xl gl-surface px-3">
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
    </ActionForm>
  );
}
