import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NavRow, SectionHead, SubHeader } from "@/components/features/screens/ScreenHeader";
import { formatNumber } from "@/lib/format";
import { Icon } from "@/ui/components/Icon";
import { icon, type IconName } from "@/ui/icons";

/**
 * «الموارد» (US7, FR-050) as the Glass Edition's sub-page: the map and the norms as illustrated cards,
 * then «مكتبة الرحلة» (files, recordings, references with their counts). Props only.
 */
export async function ResourcesView({ counts }: { counts: { file: number; recording: number; reference: number } }) {
  const t = await getTranslations("resources");
  const card = (key: "map" | "guidelines", href: string, art: IconName, green: boolean) => (
    <section aria-labelledby={`res-${key}`} className="sc-illus-card">
      <div className="sc-illus-body">
        <h2 id={`res-${key}`}>{t(`cards.${key}.title`)}</h2>
        <p>{t(`cards.${key}.text`)}</p>
        <Link href={href} className="sc-btn">
          <Icon src={icon("chevron_left")} className="sc-icon" />
          {t(`cards.${key}.action`)}
        </Link>
      </div>
      <span aria-hidden="true" className={`sc-illus-art${green ? " is-green" : ""}`}>
        <Icon src={icon(art)} className="sc-icon" />
      </span>
    </section>
  );
  const rows = [
    { key: "file", icon: "description" },
    { key: "recording", icon: "play_arrow" },
    { key: "reference", icon: "diamond" },
  ] as const;
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("title")} subtitle={t("subtitle")} backHref="/more" />
      <div className="sc-content">
        {card("map", "/resources/map", "map", false)}
        {card("guidelines", "/resources/guidelines", "flag", true)}
        <div style={{ marginTop: 20 }}>
          <SectionHead title={t("library")} />
        </div>
        <ul className="sc-rows">
          {rows.map((r) => (
            <li key={r.key}>
              <NavRow
                href={`/resources/${r.key}`}
                name={t(`sections.${r.key}`)}
                sub={`${t("count", { count: counts[r.key], n: formatNumber(counts[r.key]) })} · ${t(`kinds.${r.key}`)}`}
                iconName={r.icon}
              />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
