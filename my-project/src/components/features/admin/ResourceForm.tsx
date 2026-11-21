"use client";

import { useTranslations } from "next-intl";
import { useActionState, useRef, useState, startTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/browser";
import { prepareResourceUpload, saveResource } from "@/server/actions/admin/resources";

export type ResourceDraft = {
  id?: string;
  type?: "recording" | "file" | "reference";
  title?: string;
  description?: string | null;
  category?: string | null;
  url?: string | null;
  storagePath?: string | null;
  audience?: "program" | "cohorts" | "groups";
  cohortIds?: string[];
  groupIds?: string[];
};

/** Upload goes straight from the browser to private storage via a signed URL, then details are saved. */
export function ResourceForm({ draft = {}, cohorts, groups }: { draft?: ResourceDraft; cohorts: { id: string; name: string }[]; groups: { id: string; label: string }[] }) {
  const t = useTranslations("admin.resources");
  const ts = useTranslations("admin");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(saveResource, null);
  const [audience, setAudience] = useState(draft.audience ?? "program");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    const fd = new FormData(event.currentTarget);
    const file = fd.get("upload");
    fd.delete("upload");
    if (file instanceof File && file.size > 0) {
      setUploading(true);
      const prepared = await prepareResourceUpload(file.name);
      const uploaded = prepared.ok
        ? await createClient().storage.from("resources").uploadToSignedUrl(prepared.data.path, prepared.data.token, file)
        : null;
      setUploading(false);
      if (!prepared.ok || !uploaded || uploaded.error) return setUploadError(t("uploadFailed"));
      fd.set("storagePath", prepared.data.path);
    }
    startTransition(() => action(fd));
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="flex flex-col gap-4">
      {draft.id && <input type="hidden" name="id" value={draft.id} />}
      <Select name="type" label={t("type")} defaultValue={draft.type ?? "recording"}>
        {(["recording", "file", "reference"] as const).map((k) => (
          <option key={k} value={k}>{t(`types.${k}`)}</option>
        ))}
      </Select>
      <Field name="title" label={t("fieldTitle")} defaultValue={draft.title} required minLength={2} maxLength={160} />
      <TextArea name="description" label={t("description")} defaultValue={draft.description ?? ""} maxLength={1000} className="min-h-16" />
      <Field name="category" label={t("category")} defaultValue={draft.category ?? ""} maxLength={60} />
      <Field name="upload" type="file" label={t("file")} hint={draft.storagePath ? t("keepFile") : t("fileHint")} accept="audio/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" />
      <Field name="url" type="url" dir="ltr" label={t("url")} defaultValue={draft.url ?? ""} />
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-medium">{t("audience")}</legend>
        {(["program", "cohorts", "groups"] as const).map((a) => (
          <label key={a} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="audience" value={a} checked={audience === a} onChange={() => setAudience(a)} className="size-5 accent-sage-700" />
            {t(`audiences.${a}`)}
          </label>
        ))}
      </fieldset>
      {audience === "cohorts" &&
        cohorts.map((c) => (
          <label key={c.id} className="flex min-h-11 items-center gap-3 ps-6">
            <input type="checkbox" name="cohortIds" value={c.id} defaultChecked={draft.cohortIds?.includes(c.id)} className="size-5 accent-sage-700" />
            {c.name}
          </label>
        ))}
      {audience === "groups" &&
        groups.map((g) => (
          <label key={g.id} className="flex min-h-11 items-center gap-3 ps-6">
            <input type="checkbox" name="groupIds" value={g.id} defaultChecked={draft.groupIds?.includes(g.id)} className="size-5 accent-sage-700" />
            {g.label}
          </label>
        ))}
      {(uploadError || (state && !state.ok)) && (
        <p role="alert" className="text-sm text-dawn-700">{uploadError ?? (state && !state.ok ? te(state.error) : "")}</p>
      )}
      {state?.ok && <p role="status" className="text-sm text-sage-700">{ts("saved")}</p>}
      <Button type="submit" disabled={pending || uploading} className="self-start">
        {uploading ? t("uploading") : t("save")}
      </Button>
    </form>
  );
}
