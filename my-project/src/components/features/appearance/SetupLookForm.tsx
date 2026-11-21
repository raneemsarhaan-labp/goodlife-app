"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useTransition } from "react";
import { buttonClass } from "@/components/ui/Button";
import { setAppearance, skipAppearanceChoice } from "@/server/actions/appearance";
import { VersionPicker } from "@/ui/components/VersionPicker";
import type { UiVersion } from "@/ui/versions";

/** First-run choice of version (spec 002 US1, FR-001–FR-003). */
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
    <form action={dispatch} className="flex flex-col gap-5">
      <VersionPicker initial={initial} />
      {state && !state.ok && (
        <p role="alert" className="text-sm text-dawn-700">
          {te(state.error)}
        </p>
      )}
      <button type="submit" disabled={pending || skipping} className={buttonClass("primary")}>
        {t("choose")}
      </button>
      <button
        type="button"
        disabled={pending || skipping}
        className="min-h-11 text-sage-700 underline underline-offset-4"
        onClick={() =>
          startSkip(async () => {
            await skipAppearanceChoice();
            router.replace("/");
          })
        }
      >
        {t("skip")}
      </button>
    </form>
  );
}
