import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { CloseDayForm } from "@/components/features/today/CloseDayForm";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { formatFraction } from "@/lib/format";
import { getToday } from "@/server/queries/today";

export const generateMetadata = pageTitle("closeDay");

/** «ختام اليوم»: summary of the day, optional reflection, closing message (FR-014). */
export default async function CloseDayPage() {
  const [t, tt, data] = await Promise.all([getTranslations("closeDay"), getTranslations("today"), getToday()]);
  const habits = data?.habits ?? [];
  const status = (done: boolean | undefined) => (done ? tt("challengeDone") : tt("challengeNotDone"));
  return (
    <Sheet title={t("title")}>
      <p className="text-ink-700">{t("intro")}</p>
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-ink-500">{t("yourIntention")}</p>
          <p className="text-lg">{data?.day?.intention ?? t("noIntention")}</p>
        </div>
        <p>{t("habitsDone", { progress: formatFraction(habits.filter((h) => h.done).length, habits.length) })}</p>
        {data?.journey_challenge && <p>{t("challengeStatus", { label: tt("journeyChallenge"), status: status(data.journey_challenge.done) })}</p>}
        {data?.own_challenge && <p>{t("challengeStatus", { label: tt("ownChallenge"), status: status(data.own_challenge.done) })}</p>}
      </Card>
      <CloseDayForm />
    </Sheet>
  );
}
