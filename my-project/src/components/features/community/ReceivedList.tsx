import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/format";

export async function ReceivedList({ items }: { items: { id: string; sender_name: string; phrase: string; local_date: string }[] }) {
  const t = await getTranslations("community");
  return (
    <section aria-labelledby="received" className="sc-card">
      <h2 id="received" className="sc-h">{t("receivedTitle")}</h2>
      {items.length === 0 ? (
        <p className="sc-text sc-muted">{t("noneReceived")}</p>
      ) : (
        <ul className="sc-list">
          {items.map((e) => (
            <li key={e.id} className="flex flex-col">
              <span className="sc-text">{t("receivedItem", { phrase: e.phrase, name: e.sender_name })}</span>
              <span className="sc-text sc-muted" style={{ fontSize: 12 }}>{formatDate(e.local_date)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
