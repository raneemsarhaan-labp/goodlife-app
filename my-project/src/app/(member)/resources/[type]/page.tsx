import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OpenResource } from "@/components/features/resources/OpenResource";
import { SectionHead, SubHeader } from "@/components/features/screens/ScreenHeader";
import { createClient } from "@/lib/supabase/server";
import { RESOURCE_TYPES } from "@/lib/validation/resources";

export const generateMetadata = pageTitle("resources");

/** Recordings, files, or references visible to the member, grouped by category (the design's sub-page). */
export default async function ResourceListPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!(RESOURCE_TYPES as readonly string[]).includes(type)) notFound();
  const kind = type as (typeof RESOURCE_TYPES)[number];
  const t = await getTranslations("resources");
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("id, title, description, category").eq("type", kind).order("sort_order");
  const byCategory = new Map<string, NonNullable<typeof data>>();
  for (const r of data ?? []) {
    const key = r.category ?? t("uncategorized");
    byCategory.set(key, [...(byCategory.get(key) ?? []), r]);
  }
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t(`sections.${kind}`)} subtitle={t(`kinds.${kind}`)} backHref="/resources" />
      <div className="sc-content">
        {byCategory.size === 0 && <p className="sc-text sc-muted">{t("none")}</p>}
        {[...byCategory.entries()].map(([category, items], i) => (
          <section key={category} aria-labelledby={`cat-${i}`}>
            <div style={i === 0 ? { marginTop: -22 } : undefined}>
              <SectionHead id={`cat-${i}`} title={category} />
            </div>
            <ul className="sc-rows">
              {items.map((r) => (
                <li key={r.id} className="sc-card sc-item">
                  <h3>{r.title}</h3>
                  {r.description && <p>{r.description}</p>}
                  <OpenResource id={r.id} type={kind} title={r.title} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
