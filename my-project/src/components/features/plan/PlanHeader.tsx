import { getTranslations } from "next-intl/server";
import { formatDate, formatNumber } from "@/lib/format";
import { greetingKey, localHour } from "@/lib/journey";

/**
 * The header of «خطتي» and «تأمّلاتي» as designed: greeting, title and date · journey day on the
 * text side, the logo at the other end (a frosted band on the glass versions).
 */
export async function PlanHeader({
  title,
  name,
  timeZone,
  localDate,
  journeyDay,
}: {
  title: string;
  name: string;
  timeZone: string;
  localDate: string;
  journeyDay?: number | null;
}) {
  const t = await getTranslations("today");
  const firstName = name.split(/\s+/)[0] ?? name;
  return (
    <header className="pn-header">
      <div className="pn-header-text">
        <p className="pn-greet">{t(`greeting.${greetingKey(localHour(timeZone))}`, { name: firstName })}</p>
        <h1 className="pn-title">{title}</h1>
        <p className="pn-date">
          {formatDate(localDate)}
          {journeyDay ? <> · {t("journeyDay", { day: formatNumber(journeyDay) })}</> : null}
        </p>
      </div>
      <span className="pn-logo">
        {/* eslint-disable-next-line @next/next/no-img-element -- 52px brand mark */}
        <img src="/design/logo.webp" alt="" width={52} height={52} />
      </span>
    </header>
  );
}
