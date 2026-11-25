import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { formatDate, formatNumber } from "@/lib/format";
import { greetingKey, localHour } from "@/lib/journey";
import { Icon } from "@/ui/components/Icon";
import { icon, type IconName } from "@/ui/icons";

/**
 * Header of «أثرك»، «المجتمع» and «المزيد» as the Glass Edition draws it: greeting, the screen's title,
 * date · journey day, and the logo at the far side. `dark` is the design's green band («المزيد»).
 */
export async function ScreenHeader({
  title,
  name,
  timeZone,
  localDate,
  journeyDay,
  dark = false,
}: {
  title: string;
  name: string;
  timeZone: string;
  localDate: string;
  journeyDay?: number;
  dark?: boolean;
}) {
  const t = await getTranslations("today");
  const firstName = name.split(/\s+/)[0] ?? name;
  return (
    <header className={`sc-header${dark ? " is-dark" : ""}`}>
      {dark && <span aria-hidden="true" className="sc-blob" />}
      <div className="sc-header-text">
        <p className="sc-greet">{t(`greeting.${greetingKey(localHour(timeZone))}`, { name: firstName })}</p>
        <h1 className="sc-title">{title}</h1>
        <p className="sc-date">
          {formatDate(localDate)}
          {journeyDay !== undefined && <> · {t("journeyDay", { day: formatNumber(journeyDay) })}</>}
        </p>
      </div>
      <span className="sc-logo">
        {/* eslint-disable-next-line @next/next/no-img-element -- 52px brand mark */}
        <img src="/design/logo.webp" alt="" width={52} height={52} />
      </span>
    </header>
  );
}

/** The design's sub-page band: title, subtitle and a back button (a link to the parent screen). */
export async function SubHeader({ title, subtitle, backHref }: { title: string; subtitle?: string | null; backHref: string }) {
  const ts = await getTranslations("screens");
  return (
    <header className="sc-subheader">
      <div className="sc-subheader-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Link href={backHref} className="sc-back td-hit" aria-label={ts("back")}>
        <Icon src={icon("chevron_right")} className="sc-icon" />
      </Link>
    </header>
  );
}

/** A heading on the page with a hairline and an optional count or icon (the design's `.section-head`). */
export function SectionHead({ id, title, end }: { id?: string; title: string; end?: ReactNode }) {
  return (
    <div className="sc-section-head">
      <h2 id={id}>{title}</h2>
      <span aria-hidden="true" className="sc-line" />
      {end}
    </div>
  );
}

/**
 * A row link: icon tile, name and description, chevron (the design's `.more-row`). The design points
 * the chevron right on «المزيد» and its sub-pages, left elsewhere.
 */
export function NavRow({
  href,
  name,
  sub,
  iconName,
  chev = "chevron_right",
}: {
  href: string;
  name: string;
  sub?: string;
  iconName: IconName;
  chev?: "chevron_right" | "chevron_left";
}) {
  return (
    <Link href={href} className="sc-row">
      <span aria-hidden="true" className="sc-row-icon">
        <Icon src={icon(iconName)} className="sc-icon" />
      </span>
      <span className="sc-row-text">
        <span className="sc-row-name">{name}</span>
        {sub && <span className="sc-row-sub">{sub}</span>}
      </span>
      <Icon src={icon(chev)} className="sc-icon sc-row-chev" />
    </Link>
  );
}
