"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { useKeepValuesSubmit } from "@/components/ui/useKeepValuesSubmit";
import { submitReview } from "@/server/actions/reviews";

export function ReviewForm({
  month,
  questions,
  initial,
}: {
  month: string; // YYYY-MM
  questions: { id: string; text: string }[];
  initial: Record<string, string>;
}) {
  const t = useTranslations("review");
  const te = useTranslations("errors");
  const [intent, setIntent] = useState<"draft" | "complete">("draft");
  const [state, action, pending] = useActionState(submitReview, null);
  const onSubmit = useKeepValuesSubmit(action, (fd) => fd.set("intent", intent));

  if (state?.ok && state.data.completed) {
    return <p role="status" className="rounded-2xl bg-sage-50 p-4 text-lg text-sage-700">{t("completed")}</p>;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="month" value={month} />
      {questions.map((q) => (
        <TextArea key={q.id} name={`q:${q.id}`} label={q.text} defaultValue={initial[q.id] ?? ""} maxLength={2000} />
      ))}
      {state && !state.ok && <p role="alert" className="text-dawn-700">{te(state.error)}</p>}
      {state?.ok && !state.data.completed && <p role="status" className="text-sage-700">{t("savedDraft")}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" disabled={pending} onClick={() => setIntent("draft")}>
          {t("saveDraft")}
        </Button>
        <Button type="submit" disabled={pending} onClick={() => setIntent("complete")}>
          {t("complete")}
        </Button>
      </div>
    </form>
  );
}
