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
    <section aria-labelledby="choose-look" className="gl-surface flex flex-col gap-2 rounded-[var(--radius-card)] p-4">
      <h2 id="choose-look" className="font-semibold">{t("inviteTitle")}</h2>
      <p className="text-sm text-ink-700">{t("inviteBody")}</p>
      <div className="flex gap-2">
        <Link href="/account/appearance" className="inline-flex min-h-11 items-center rounded-full bg-dawn-700 px-4 text-sm font-medium text-white">
          {t("inviteAction")}
        </Link>
        <button type="button" className="min-h-11 rounded-full px-4 text-sm text-sage-700" onClick={() => { setHidden(true); start(() => skipAppearanceChoice()); }}>
          {t("inviteDismiss")}
        </button>
      </div>
    </section>
  );
}
