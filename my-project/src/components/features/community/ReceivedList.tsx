import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

export async function ReceivedList({ items }: { items: { id: string; sender_name: string; phrase: string; local_date: string }[] }) {
  const t = await getTranslations("community");
  return (
    <Card aria-labelledby="received" className="flex flex-col gap-3">
      <CardTitle id="received">{t("receivedTitle")}</CardTitle>
      {items.length === 0 ? (
        <p className="text-ink-500">{t("noneReceived")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((e) => (
            <li key={e.id} className="flex flex-col rounded-xl bg-sage-50 px-4 py-2">
              <span>{t("receivedItem", { phrase: e.phrase, name: e.sender_name })}</span>
              <span className="text-sm text-ink-500">{formatDate(e.local_date)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
