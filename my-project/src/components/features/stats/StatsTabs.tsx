import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/ui/components/Icon";
import { icon } from "@/ui/icons";

/** «أنا / مجموعتي / التحدّي» (spec 007): the design's «أثرك» segmented tabs, as links. */
export async function StatsTabs({ active }: { active: "me" | "group" | "challenge" }) {
  const t = await getTranslations("together");
  const tabs = [
    { key: "me", href: "/stats", icon: "person" },
    { key: "group", href: "/stats/group", icon: "groups" },
    { key: "challenge", href: "/stats/challenge", icon: "flag" },
  ] as const;
  return (
    <nav aria-label={t("tabsLabel")}>
      <ul className="sc-seg">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <Link href={tab.href} aria-current={active === tab.key ? "page" : undefined}>
              <Icon src={icon(tab.icon)} className="sc-icon" />
              {t(`tabs.${tab.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
