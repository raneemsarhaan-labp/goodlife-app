"use client";

import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/format";
import { icon } from "@/ui/icons";
import type { TodayActivity } from "@/server/queries/today";
import { GlassCard } from "./GlassCard";

/** «الأنشطة القادمة» on the Today view (spec 002 US2), as an Ionic list. */
export function ActivitiesCard({ activities, timeZone }: { activities: TodayActivity[]; timeZone: string }) {
  const t = useTranslations("today");
  const router = useRouter();
  return (
    <GlassCard title={t("upcoming")} titleId="upcoming">
      {activities.length === 0 ? (
        <p className="text-ink-700">{t("noUpcoming")}</p>
      ) : (
        <IonList lines="inset" className="bg-transparent">
          {activities.map((a) => (
            <IonItem
              key={a.id}
              button
              detail
              onClick={() => router.push(`/activities/${a.id}`)}
              className="[--background:transparent] [--padding-start:0]"
            >
              <IonIcon slot="start" icon={icon("event")} aria-hidden="true" />
              <IonLabel className="whitespace-normal">
                <h3 className="font-semibold">{a.title}</h3>
                <p>{formatDateTime(a.starts_at, timeZone)}</p>
                {a.location && <p>{a.location}</p>}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
    </GlassCard>
  );
}
