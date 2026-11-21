import { getTranslations } from "next-intl/server";
import { formatDate, formatHijri, formatNumber } from "@/lib/format";
import { greetingKey, localHour } from "@/lib/journey";

export async function Greeting({ name, timeZone, localDate, journeyDay }: { name: string; timeZone: string; localDate: string; journeyDay?: number }) {
  const t = await getTranslations("today");
  const firstName = name.split(/\s+/)[0] ?? name;
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">{t(`greeting.${greetingKey(localHour(timeZone))}`, { name: firstName })}</h1>
      <p className="text-ink-700">
        {formatDate(localDate)} · <span className="text-ink-500">{formatHijri(localDate)}</span>
      </p>
      {journeyDay !== undefined && (
        <p className="w-fit rounded-full bg-sage-50 px-3 py-1 text-sm font-medium text-sage-700">
          {t("journeyDay", { day: formatNumber(journeyDay) })}
        </p>
      )}
    </header>
  );
}
