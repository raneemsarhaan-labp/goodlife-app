import { pageTitle } from "@/i18n/metadata";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OpenResource } from "@/components/features/resources/OpenResource";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { RESOURCE_TYPES } from "@/lib/validation/resources";

export const generateMetadata = pageTitle("resources");

/** Recordings, files, or references visible to the member, grouped by category. */
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
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <h1 className="text-2xl font-semibold">{t(`sections.${kind}`)}</h1>
      {byCategory.size === 0 && <EmptyState title={t("none")} />}
      {[...byCategory.entries()].map(([category, items]) => (
        <section key={category} aria-labelledby={`cat-${category}`} className="flex flex-col gap-3">
          <h2 id={`cat-${category}`} className="font-semibold text-sage-700">{category}</h2>
          <ul className="flex flex-col gap-3">
            {items.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-2xl border border-sand-200 bg-white p-4">
                <p className="font-medium">{r.title}</p>
                {r.description && <p className="text-sm text-ink-700">{r.description}</p>}
                <OpenResource id={r.id} type={kind} title={r.title} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
