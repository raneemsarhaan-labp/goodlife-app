"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { joinChallenge, withdrawChallenge } from "@/server/actions/together";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

/** «انضمّ» / «انسحب من التحدّي» with a calm status line (spec 007 US2), drawn as the design's buttons. */
export function ChallengeActions({ challengeId, joined }: { challengeId: string; joined: boolean }) {
  const t = useTranslations("groupChallenge");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
  function run(join: boolean) {
    if (!join && !window.confirm(t("withdrawConfirm"))) return;
    start(async () => {
      const r = join ? await joinChallenge(challengeId) : await withdrawChallenge(challengeId);
      setStatus(r.ok ? { error: false, text: join ? t("joined") : t("withdrawn") } : { error: true, text: te(r.error) });
      router.refresh();
    });
  }
  return (
    <div>
      {joined ? (
        <button type="button" disabled={pending} onClick={() => run(false)} className="sc-withdraw">
          {t("withdraw")}
          <Icon src={icon("logout")} className="sc-icon" />
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(true)} className="sc-btn is-dark">
          <Icon src={icon("arrow_back")} className="sc-icon" />
          {t("join")}
        </button>
      )}
      <p role={status?.error ? "alert" : "status"} className={`sc-status${status?.error ? " is-error" : ""}`}>{status?.text}</p>
    </div>
  );
}
