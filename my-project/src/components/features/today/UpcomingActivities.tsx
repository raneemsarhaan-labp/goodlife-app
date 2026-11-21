import { getTranslations } from "next-intl/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import type { TodayActivity } from "@/server/queries/today";

export async function UpcomingActivities({ activities, timeZone }: { activities: TodayActivity[]; timeZone: string }) {
  const t = await getTranslations("today");
  return (
    <Card aria-labelledby="upcoming">
      <CardTitle id="upcoming">{t("upcoming")}</CardTitle>
      {activities.length === 0 ? (
        <p className="mt-2 text-ink-700">{t("noUpcoming")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {activities.map((a) => (
            <li key={a.id} className="flex flex-col border-s-4 border-sage-600 ps-3">
              <span className="font-medium">{a.title}</span>
              <span className="text-sm text-ink-700">{formatDateTime(a.starts_at, timeZone)}</span>
              {a.location && <span className="text-sm text-ink-500">{a.location}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
