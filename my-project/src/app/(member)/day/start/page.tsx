import { getTranslations } from "next-intl/server";
import { IntentionForm } from "@/components/features/today/IntentionForm";
import { Sheet } from "@/components/ui/Sheet";
import { getToday } from "@/server/queries/today";

export const metadata = { title: "ابدأ يومك" };

export default async function StartDayPage() {
  const [t, data] = await Promise.all([getTranslations("startDay"), getToday()]);
  return (
    <Sheet title={t("title")}>
      <p className="text-ink-700">{t("intro")}</p>
      <IntentionForm initial={data?.day?.intention ?? ""} />
    </Sheet>
  );
}
