"use client";

import { IonModal } from "@ionic/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { dismissRitual } from "@/server/actions/appearance";
import { icon } from "@/ui/icons";
import { Icon } from "./Icon";

/** Opening ritual: «من اقتباسات الحياة الطيبة» + «ابدأ يومي», once a day (FR-030–FR-032), as designed. */
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
    <IonModal isOpen={open} onDidDismiss={() => finish()} className="td-quote-modal" aria-labelledby="ritual-title">
      <div className="td-quote">
        <span aria-hidden="true" className="td-quote-art" />
        <button type="button" onClick={() => finish()} aria-label={t("close")} title={t("close")} className="td-round td-hit td-quote-close">
          <Icon src={icon("close")} />
        </button>
        <span aria-hidden="true" className="td-quote-badge">
          <span>”</span>
        </span>
        <p className="td-kicker">
          <i aria-hidden="true" />
          <Icon src={icon("local_florist")} />
          <span id="ritual-title">{t("label")}</span>
          <Icon src={icon("local_florist")} />
          <i aria-hidden="true" />
        </p>
        <blockquote className="td-quote-text">
          {quote.text}
          {quote.source && <footer className="td-quote-source">— {quote.source}</footer>}
        </blockquote>
        <button type="button" onClick={() => finish("/day/start")} className="td-quote-start">
          {t("start")}
        </button>
      </div>
    </IonModal>
  );
}
