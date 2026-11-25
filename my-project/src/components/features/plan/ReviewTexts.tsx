"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import type { Result } from "@/server/actions/result";

type Action = (prev: Result<null> | null, formData: FormData) => Promise<Result<null> | null>;
type Text = { name: string; label: string; hint: string; placeholder: string; value: string; action: Action };

/**
 * The review's first part as designed: «هويّتي» and «حالي المنشود» to reread in their boxes, with
 * «عدّلهما» turning both into fields (each saved on its own). Open for writing when either is empty.
 */
export function ReviewTexts({ texts }: { texts: [Text, Text] }) {
  const t = useTranslations("planReview");
  const ti = useTranslations("identity");
  const uid = useId();
  const [editing, setEditing] = useState(texts.some((x) => !x.value.trim()));
  return (
    <div id={`${uid}-texts`}>
      {texts.map((x, i) => (
        <section key={x.name} aria-labelledby={`${uid}-${i}`} className="pf-field">
          <h2 id={`${uid}-${i}`} className="pn-label">
            {x.label}
          </h2>
          {editing ? (
            <ActionForm action={x.action} submitLabel={ti("save")} successText={ti("saved")} className="pn-form flex flex-col gap-2">
              <label htmlFor={`${uid}-${i}-field`} className="sr-only">
                {x.label}
              </label>
              <textarea id={`${uid}-${i}-field`} name={x.name} defaultValue={x.value} maxLength={2000} placeholder={x.placeholder} aria-describedby={`${uid}-${i}-hint`} />
              <p id={`${uid}-${i}-hint`} className="pf-hint !mt-0">
                {x.hint}
              </p>
            </ActionForm>
          ) : (
            <>
              <p className={`pf-box ${x.value.trim() ? "" : "is-empty"}`}>{x.value.trim() || t("notWritten")}</p>
              <p className="pf-hint">{x.hint}</p>
            </>
          )}
        </section>
      ))}
      <button type="button" className="pf-edit-btn td-hit" aria-expanded={editing} aria-controls={`${uid}-texts`} onClick={() => setEditing((e) => !e)}>
        {editing ? t("doneEditing") : t("editBoth")}
      </button>
    </div>
  );
}
