"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field, TextArea } from "@/components/ui/Field";
import { saveActivity } from "@/server/actions/activities";

export type ActivityDraft = {
  id?: string;
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  location?: string | null;
  groupIds?: string[];
  cohortId?: string | null;
};

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
  return (
    <ActionForm action={saveActivity} submitLabel={t("save")} successText={ts("saved")} resetOnSuccess={!draft.id}>
      {draft.id && <input type="hidden" name="id" value={draft.id} />}
      <Field name="title" label={t("fieldTitle")} defaultValue={draft.title} required minLength={2} maxLength={120} />
      <TextArea name="description" label={t("description")} defaultValue={draft.description ?? ""} maxLength={2000} />
      <Field name="startsAt" type="datetime-local" label={t("startsAt")} hint={t("timeZoneNote", { tz: timeZone })} defaultValue={draft.startsAt} required />
      <Field name="endsAt" type="datetime-local" label={t("endsAt")} defaultValue={draft.endsAt} />
      <Field name="location" label={t("location")} defaultValue={draft.location ?? ""} maxLength={300} />
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
