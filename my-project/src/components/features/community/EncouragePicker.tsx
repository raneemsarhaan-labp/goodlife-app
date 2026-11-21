"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { sendEncouragement } from "@/server/actions/community";

/** Preset phrases only — there is deliberately no text input (FR-040). */
export function EncouragePicker({ recipient, phrases, alreadyToday }: { recipient: { id: string; name: string }; phrases: { id: string; text: string }[]; alreadyToday: boolean }) {
  const t = useTranslations("community");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState(sendEncouragement, null);
  if (alreadyToday || state?.ok) {
    return <p role="status" className="text-sm text-sage-700">{state?.ok ? t("sent") : t("alreadyToday")}</p>;
  }
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="recipientId" value={recipient.id} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`phrase-${recipient.id}`} className="text-sm text-ink-700">
          {t("encourage", { name: recipient.name })}
        </label>
        <select id={`phrase-${recipient.id}`} name="phraseId" className="min-h-11 rounded-xl gl-surface px-3">
          {phrases.map((p) => (
            <option key={p.id} value={p.id}>{p.text}</option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>{t("send")}</Button>
      {state && !state.ok && <p role="alert" className="w-full text-sm text-dawn-700">{te(state.error)}</p>}
    </form>
  );
}
