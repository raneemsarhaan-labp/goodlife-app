import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import type { Peer } from "@/server/queries/community";
import { EncouragePicker } from "./EncouragePicker";

export async function MemberList({ members, phrases, encouragedToday }: { members: Peer[]; phrases: { id: string; text: string }[]; encouragedToday: Set<string> }) {
  const t = await getTranslations("community");
  return (
    <Card aria-labelledby="members" className="flex flex-col gap-3">
      <CardTitle id="members">{t("members")}</CardTitle>
      {members.length === 0 && <p className="text-ink-500">{t("noMembers")}</p>}
      <ul className="flex flex-col gap-4">
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-col gap-2 border-b border-sand-100 pb-3 last:border-0">
            <p className="font-medium">{m.full_name}</p>
            {phrases.length > 0 && (
              <EncouragePicker recipient={{ id: m.user_id, name: m.full_name }} phrases={phrases} alreadyToday={encouragedToday.has(m.user_id)} />
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
