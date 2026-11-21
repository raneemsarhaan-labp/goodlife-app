"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { formatNumber } from "@/lib/format";
import { copyHabitsFromPreviousPlan } from "@/server/actions/plan";

/** Offer on a new journey's «خطتي»: copy last journey's habits (data-model.md › New journey). */
export function CopyPreviousHabits({ count }: { count: number }) {
  const t = useTranslations("plan");
  return (
    <section aria-labelledby="copy-previous" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-sage-100 bg-sage-50 p-5">
      <h2 id="copy-previous" className="text-lg font-semibold text-sage-700">{t("copyTitle")}</h2>
      <p>{t("copyBody", { count: formatNumber(count) })}</p>
      <ActionForm
        action={copyHabitsFromPreviousPlan}
        submitLabel={t("copy")}
        renderSuccess={({ count: copied }) => <p role="status" className="text-sage-700">{t("copied", { count: formatNumber(copied) })}</p>}
      >
        {null}
      </ActionForm>
    </section>
  );
}
