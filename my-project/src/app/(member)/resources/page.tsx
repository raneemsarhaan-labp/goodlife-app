import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "الموارد" };

/** «الموارد» hub (US7, FR-050). Counts reflect only what the member may see (RLS). */
export default async function ResourcesPage() {
  const t = await getTranslations("resources");
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("type");
  const count = (type: string) => (data ?? []).filter((r) => r.type === type).length;
  const sections = [
    { href: "/resources/map", key: "map" },
    { href: "/resources/guidelines", key: "guidelines" },
    { href: "/resources/recording", key: "recording", n: count("recording") },
    { href: "/resources/file", key: "file", n: count("file") },
    { href: "/resources/reference", key: "reference", n: count("reference") },
  ];
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-ink-700">{t("intro")}</p>
      </header>
      <ul className="grid grid-cols-1 gap-3">
        {sections.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="block">
              <Card className="flex min-h-16 items-center justify-between hover:bg-sage-50">
                <span className="text-lg font-medium">{t(`sections.${s.key}`)}</span>
                {s.n !== undefined && <span className="text-sm text-ink-500">{t("count", { count: formatNumber(s.n) })}</span>}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
