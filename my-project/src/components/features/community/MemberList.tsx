import { getTranslations } from "next-intl/server";
import type { Peer } from "@/server/queries/community";
import { EncouragePicker } from "./EncouragePicker";

export async function MemberList({ members, phrases, encouragedToday }: { members: Peer[]; phrases: { id: string; text: string }[]; encouragedToday: Set<string> }) {
  const t = await getTranslations("community");
  return (
    <section aria-labelledby="members" className="sc-card">
      <h2 id="members" className="sc-h">{t("members")}</h2>
      {members.length === 0 && <p className="sc-text sc-muted">{t("noMembers")}</p>}
      <ul className="sc-list">
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-col gap-2">
            <p className="sc-text" style={{ fontWeight: 700 }}>{m.full_name}</p>
            {phrases.length > 0 && (
              <EncouragePicker recipient={{ id: m.user_id, name: m.full_name }} phrases={phrases} alreadyToday={encouragedToday.has(m.user_id)} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
