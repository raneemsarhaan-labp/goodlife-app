import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";
import { localDate } from "@/lib/journey";

export async function LastUpdated({ at, timeZone }: { at: string; timeZone: string }) {
  const t = await getTranslations("plan");
  return <p className="text-sm text-ink-500">{t("lastUpdated", { date: formatDate(localDate(timeZone, new Date(at)), { withYear: true }) })}</p>;
}
