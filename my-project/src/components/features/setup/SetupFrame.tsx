import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";
import { leaveSetup } from "@/server/actions/setup";

export const SETUP_TOTAL = 5;

/** One step of «رحلة البداية»: progress, a question, its form, and «أكمل لاحقًا». */
export async function SetupFrame({
  step,
  title,
  intro,
  fromToday = false,
  error,
  children,
}: {
  step: number;
  title: string;
  intro: string;
  fromToday?: boolean;
  /** Set when saving this step failed (?error=code). */
  error?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("setup");
  return (
    <main id="main" className="flex flex-col gap-5">
      {!fromToday && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-700">{t("progress", { step: formatNumber(step), total: formatNumber(SETUP_TOTAL) })}</p>
          <form action={leaveSetup}>
            <button type="submit" className="min-h-11 text-sm text-ink-700 underline underline-offset-4">
              {t("later")}
            </button>
          </form>
        </div>
      )}
      {!fromToday && (
        <ol aria-hidden="true" className="flex gap-1.5">
          {Array.from({ length: SETUP_TOTAL }, (_, i) => (
            <li key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-sage-700" : "bg-sand-200"}`} />
          ))}
        </ol>
      )}
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="leading-loose text-ink-700">{intro}</p>
      {error && (
        <p role="alert" className="rounded-2xl bg-dawn-50 p-4 text-ink-900">
          {t("saveFailed")} <span dir="ltr" className="text-xs text-ink-700">({error})</span>
        </p>
      )}
      {children}
    </main>
  );
}

/** «التالي» and «تخطَّ» for a step form. */
export async function SetupButtons({ fromToday = false, canSkip = true }: { fromToday?: boolean; canSkip?: boolean }) {
  const t = await getTranslations("setup");
  return (
    <div className="flex flex-col gap-2">
      <button type="submit" name="intent" value="next" className={buttonClass("primary")}>
        {fromToday ? t("save") : t("next")}
      </button>
      {canSkip && (
        <button type="submit" name="intent" value="skip" formNoValidate className={buttonClass("quiet")}>
          {fromToday ? t("cancel") : t("skip")}
        </button>
      )}
    </div>
  );
}
