"use client";

import { IonFab, IonFabButton, IonFabList, IonIcon } from "@ionic/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { icon, type IconName } from "@/ui/icons";

/** The floating + button with quick actions (FR-024), terracotta as designed. */
export function QuickActions({ closed }: { closed: boolean }) {
  const t = useTranslations("quick");
  const router = useRouter();
  const actions: { key: "addHabit" | "ownChallenge" | "startDay" | "closeDay"; href: string; icon: IconName }[] = [
    { key: "addHabit", href: "/habits/new", icon: "add" },
    { key: "ownChallenge", href: "/#own-challenge", icon: "edit" },
    ...(closed ? [] : [{ key: "startDay" as const, href: "/day/start", icon: "wb_sunny" as IconName }, { key: "closeDay" as const, href: "/day/close", icon: "nightlight" as IconName }]),
  ];
  return (
    <IonFab slot="fixed" vertical="bottom" horizontal="start" className="gl-fab">
      <IonFabButton aria-label={t("open")} className="td-fab">
        <IonIcon icon={icon("add")} aria-hidden="true" />
      </IonFabButton>
      <IonFabList side="top">
        {actions.map((a) => (
          <IonFabButton key={a.key} color="light" aria-label={t(a.key)} title={t(a.key)} onClick={() => router.push(a.href)}>
            <IonIcon icon={icon(a.icon)} />
          </IonFabButton>
        ))}
      </IonFabList>
    </IonFab>
  );
}
