"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { cancelRegistration, registerForActivity } from "@/server/actions/activities";

/** «سجّلني» / «ألغِ تسجيلي» (spec 003 FR-012), drawn as the design's dark button. Server refusals are explained in Arabic. */
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
    <div>
      {registered ? (
        <button type="button" disabled={pending} onClick={() => run("cancel")} className="sc-join is-quiet">
          {t("cancel")}
        </button>
      ) : (
        canRegister && (
          <button type="button" disabled={pending} onClick={() => run("register")} className="sc-join">
            {t("register")}
          </button>
        )
      )}
      <p role={status?.kind === "error" ? "alert" : "status"} className={`sc-status${status?.kind === "error" ? " is-error" : ""}`}>
        {status?.text}
      </p>
    </div>
  );
}
