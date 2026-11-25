import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { leaveSetup } from "@/server/actions/setup";

export const SETUP_TOTAL = 5;

/**
 * One step of «رحلة البداية», drawn as the habit flow: the header with the question, «الخطوة ١ من ٥»,
 * «أكمل لاحقًا» and the segmented progress; then the intro (with its illustration, when given), a
 * save error, and the step's form (`StepForm`: body and sticky footer).
 */
export async function SetupFrame({
  step,
  title,
  intro,
  art,
  fromToday = false,
  progress = !fromToday,
  later = !fromToday,
  error,
  className = "",
  children,
}: {
  step: number;
  title: string;
  intro: string;
  /** An illustration beside the intro: `{ src, plain }` (plain: contained on a soft circle). */
  art?: { src: string; plain?: boolean };
  fromToday?: boolean;
  /** Show «الخطوة ن من ٥» and the progress bar (not when opened from «يومك»). */
  progress?: boolean;
  /** Show «أكمل لاحقًا» (not when opened from «يومك», nor on «شكل التطبيق», which has its own skip). */
  later?: boolean;
  /** Set when saving this step failed (?error=code). */
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("setup");
  return (
    <main id="main" className={`af-page au-setup ${className}`}>
      <header className="af-header">
        <div className="af-top">
          <div>
            <h1 className="af-title">{title}</h1>
            {progress && <p className="af-sub">{t("progress", { step: formatNumber(step), total: formatNumber(SETUP_TOTAL) })}</p>}
          </div>
          {later && (
            <form action={leaveSetup}>
              <button type="submit" className="au-later">
                {t("later")}
              </button>
            </form>
          )}
        </div>
        {progress && (
          <div className="af-progress" aria-hidden="true">
            {Array.from({ length: SETUP_TOTAL }, (_, i) => (
              <i key={i} className={i < step ? "is-on" : undefined} />
            ))}
          </div>
        )}
      </header>
      <SetupLead intro={intro} art={art} />
      {error && (
        <p role="alert" className="au-notice mx-5 mt-4">
          <span>
            {t("saveFailed")} <span dir="ltr" className="text-xs text-ink-700">({error})</span>
          </span>
        </p>
      )}
      {children}
    </main>
  );
}

function SetupLead({ intro, art }: { intro: string; art?: { src: string; plain?: boolean } }) {
  return (
    <div className="au-lead px-5 pt-5">
      <p>{intro}</p>
      {art && (
        <span className={`au-lead-art ${art.plain ? "is-plain" : ""}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative illustration */}
          <img src={art.src} alt="" width={84} height={84} />
        </span>
      )}
    </div>
  );
}

/** A step's form: the body, then «التالي» / «تخطَّ» in the flow's sticky footer. */
export async function StepForm({
  action,
  fromToday = false,
  canSkip = true,
  footerNote,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fromToday?: boolean;
  canSkip?: boolean;
  footerNote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="au-step-form">
      {fromToday && <input type="hidden" name="from" value="today" />}
      <div className="af-body">{children}</div>
      <div className="af-footer">
        {footerNote}
        <SetupButtons fromToday={fromToday} canSkip={canSkip} />
      </div>
    </form>
  );
}

/** «التالي» and «تخطَّ» for a step form. */
export async function SetupButtons({ fromToday = false, canSkip = true }: { fromToday?: boolean; canSkip?: boolean }) {
  const t = await getTranslations("setup");
  return (
    <>
      <button type="submit" name="intent" value="next" className="af-next">
        {fromToday ? t("save") : t("next")}
      </button>
      {canSkip && (
        <button type="submit" name="intent" value="skip" formNoValidate className="au-text-btn">
          {fromToday ? t("cancel") : t("skip")}
        </button>
      )}
    </>
  );
}
