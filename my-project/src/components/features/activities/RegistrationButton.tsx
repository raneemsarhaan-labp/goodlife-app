"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { cancelRegistration, registerForActivity } from "@/server/actions/activities";

/** «سجّلني» / «ألغِ تسجيلي» (spec 003 FR-012). Server refusals are explained in Arabic. */
export function RegistrationButton({ activityId, registered, canRegister }: { activityId: string; registered: boolean; canRegister: boolean }) {
  const t = useTranslations("activityRegistration");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function run(action: "register" | "cancel") {
    setStatus(null);
    start(async () => {
      const result = action === "register" ? await registerForActivity(activityId) : await cancelRegistration(activityId);
      if (result.ok) {
        setStatus({ kind: "ok", text: action === "register" ? t("registered") : t("cancelledRegistration") });
        router.refresh();
      } else {
        const text = result.error === "limit_reached" ? t("full") : result.error === "conflict" ? t("closed") : te(result.error);
        setStatus({ kind: "error", text });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {registered ? (
        <button type="button" disabled={pending} onClick={() => run("cancel")} className="min-h-12 rounded-full px-6 font-medium text-dawn-700 ring-1 ring-dawn-700 disabled:opacity-50">
          {t("cancel")}
        </button>
      ) : (
        canRegister && (
          <button type="button" disabled={pending} onClick={() => run("register")} className="min-h-12 rounded-full bg-dawn-700 px-6 font-medium text-white disabled:opacity-50">
            {t("register")}
          </button>
        )
      )}
      <p role={status?.kind === "error" ? "alert" : "status"} className={`text-sm ${status?.kind === "error" ? "text-dawn-700" : "text-sage-700"}`}>
        {status?.text}
      </p>
    </div>
  );
}
