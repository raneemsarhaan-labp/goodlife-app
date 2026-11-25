"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useTransition } from "react";
import { setAppearance, skipAppearanceChoice } from "@/server/actions/appearance";
import { VersionPicker } from "@/ui/components/VersionPicker";
import type { UiVersion } from "@/ui/versions";

/** First-run choice of version (spec 002 US1, FR-001–FR-003), in the setup steps' body and footer. */
export function SetupLookForm({ initial }: { initial: UiVersion }) {
  const t = useTranslations("setupLook");
  const te = useTranslations("errors");
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(setAppearance, null);
  const [skipping, startSkip] = useTransition();
  useEffect(() => {
    if (state?.ok) router.replace("/");
  }, [state, router]);
  return (
    <form action={dispatch} className="au-step-form">
      <div className="af-body">
        <VersionPicker initial={initial} />
      </div>
      <div className="af-footer">
        {state && !state.ok && (
          <p role="alert" className="af-alert">
            {te(state.error)}
          </p>
        )}
        <button type="submit" disabled={pending || skipping} className="af-next">
          {t("choose")}
        </button>
        <button
          type="button"
          disabled={pending || skipping}
          className="au-text-btn"
          onClick={() =>
            startSkip(async () => {
              await skipAppearanceChoice();
              router.replace("/");
            })
          }
        >
          {t("skip")}
        </button>
      </div>
    </form>
  );
}
