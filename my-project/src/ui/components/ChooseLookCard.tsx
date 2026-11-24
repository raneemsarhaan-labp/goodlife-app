"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { skipAppearanceChoice } from "@/server/actions/appearance";

/** One-time invitation for members who have not chosen a version yet (spec edge case). */
export function ChooseLookCard() {
  const t = useTranslations("appearance");
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;
  return (
    <section aria-labelledby="choose-look" className="td-card flex flex-col gap-2">
      <h2 id="choose-look" className="td-card-title">{t("inviteTitle")}</h2>
      <p className="td-empty-body">{t("inviteBody")}</p>
      <div className="flex gap-2">
        <Link href="/account/appearance" className="td-cc-btn td-hit td-btn-primary">
          {t("inviteAction")}
        </Link>
        <button type="button" className="td-cc-btn td-hit td-cc-quiet" onClick={() => { setHidden(true); start(() => skipAppearanceChoice()); }}>
          {t("inviteDismiss")}
        </button>
      </div>
    </section>
  );
}
