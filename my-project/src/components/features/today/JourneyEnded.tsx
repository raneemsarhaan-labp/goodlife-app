import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Calm closing state after day 365 (spec edge case "Journey end"). */
export async function JourneyEnded() {
  const t = await getTranslations("today");
  return (
    <Card className="flex flex-col gap-3 text-center">
      <h2 className="text-xl font-semibold">{t("journeyEndedTitle")}</h2>
      <p className="text-ink-700">{t("journeyEndedBody")}</p>
      <div className="flex justify-center gap-2">
        <Link href="/stats" className={buttonClass("secondary")}>
          {t("viewStats")}
        </Link>
        <Link href="/reviews" className={buttonClass("quiet")}>
          {t("viewReviews")}
        </Link>
      </div>
    </Card>
  );
}
