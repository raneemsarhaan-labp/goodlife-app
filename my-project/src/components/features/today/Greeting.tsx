import { getTranslations } from "next-intl/server";
import { formatDate, formatNumber } from "@/lib/format";
import { greetingKey, localHour } from "@/lib/journey";

/**
 * «يومك» header as designed: the greeting, «يومك» with the logo, then the date and the journey day.
 * On the glass versions it is a frosted band over the background art.
 */
export async function Greeting({ name, timeZone, localDate, journeyDay }: { name: string; timeZone: string; localDate: string; journeyDay?: number }) {
  const t = await getTranslations("today");
  const firstName = name.split(/\s+/)[0] ?? name;
  return (
    <header className="td-header">
      <p className="td-greet">{t(`greeting.${greetingKey(localHour(timeZone))}`, { name: firstName })}</p>
      <div className="td-lockup">
        <h1 className="td-title">{t("pageTitle")}</h1>
        <span className="td-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 52px brand mark */}
          <img src="/design/logo.webp" alt="" width={52} height={52} />
        </span>
      </div>
      <p className="td-date">
        {formatDate(localDate)}
        {journeyDay !== undefined && <> · {t("journeyDay", { day: formatNumber(journeyDay) })}</>}
      </p>
    </header>
  );
}
