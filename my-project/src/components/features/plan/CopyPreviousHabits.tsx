"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ui/ActionForm";
import { formatNumber } from "@/lib/format";
import { copyHabitsFromPreviousPlan } from "@/server/actions/plan";

/** Offer on a new journey's «خطتي»: copy last journey's habits (data-model.md › New journey). */
export function CopyPreviousHabits({ count }: { count: number }) {
  const t = useTranslations("plan");
  return (
    <section aria-labelledby="copy-previous" className="pn-card pn-copy flex flex-col gap-2">
      <h2 id="copy-previous" className="pn-label">
        {t("copyTitle")}
      </h2>
      <p className="m-0 text-[13.5px] leading-[1.75]">{t("copyBody", { count, n: formatNumber(count) })}</p>
      <ActionForm
        action={copyHabitsFromPreviousPlan}
        submitLabel={t("copy")}
        className="pn-form flex flex-col gap-2"
        renderSuccess={({ count: copied }) => <p role="status">{t("copied", { count: copied, n: formatNumber(copied) })}</p>}
      >
        {null}
      </ActionForm>
    </section>
  );
}
