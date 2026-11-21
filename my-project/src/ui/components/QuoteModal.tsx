"use client";

import { IonButton, IonIcon, IonModal } from "@ionic/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { dismissRitual } from "@/server/actions/appearance";
import { icon } from "@/ui/icons";

/** Opening ritual: «من اقتباسات الحياة الطيبة» + «ابدأ يومي», once a day (FR-030–FR-032). */
export function QuoteModal({ quote }: { quote: { text: string; source: string | null } }) {
  const t = useTranslations("ritual");
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const finish = (next?: string) => {
    setOpen(false);
    void dismissRitual();
    if (next) router.push(next);
  };
  return (
    <IonModal isOpen={open} onDidDismiss={() => finish()} className="[--border-radius:28px] [--height:auto] [--width:min(92vw,24rem)]" aria-labelledby="ritual-title">
      <div className="gl-surface-strong relative flex flex-col items-center gap-5 overflow-hidden px-6 pb-8 pt-8 text-center">
        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-sand-100 text-dawn-600">
          <IonIcon icon={icon("format_quote")} className="size-8" />
        </span>
        <p id="ritual-title" className="text-sm font-semibold text-ink-700">
          {t("label")}
        </p>
        <blockquote className="text-xl leading-loose text-ink-900">
          {quote.text}
          {quote.source && <footer className="mt-2 text-sm text-ink-500">— {quote.source}</footer>}
        </blockquote>
        <IonButton color="secondary" shape="round" className="min-w-48" onClick={() => finish("/day/start")}>
          {t("start")}
        </IonButton>
        <IonButton fill="clear" color="primary" onClick={() => finish()}>
          {t("close")}
        </IonButton>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative corner art */}
        <img src="/ui/art-quote.webp" alt="" aria-hidden="true" width={160} height={80} className="pointer-events-none absolute -bottom-2 -start-2 w-40 opacity-90" />
      </div>
    </IonModal>
  );
}
