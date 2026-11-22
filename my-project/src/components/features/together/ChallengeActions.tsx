"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { joinChallenge, withdrawChallenge } from "@/server/actions/together";

/** «انضمّ» / «انسحب من التحدّي» with a calm status line (spec 007 US2). */
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
    <div className="flex flex-col gap-2">
      {joined ? (
        <button type="button" disabled={pending} onClick={() => run(false)} className="min-h-11 self-start rounded-full px-5 text-sm font-medium text-dawn-700 ring-1 ring-dawn-700 disabled:opacity-50">
          {t("withdraw")}
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(true)} className="min-h-12 self-start rounded-full bg-dawn-700 px-6 font-medium text-white disabled:opacity-50">
          {t("join")}
        </button>
      )}
      <p role={status?.error ? "alert" : "status"} className={`text-sm ${status?.error ? "text-dawn-700" : "text-sage-700"}`}>{status?.text}</p>
    </div>
  );
}
