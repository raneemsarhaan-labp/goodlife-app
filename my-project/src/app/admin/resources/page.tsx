import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResourceForm } from "@/components/features/admin/ResourceForm";
import { ReorderList } from "@/components/features/habits/ReorderList";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { deleteResource, reorderResources } from "@/server/actions/admin/resources";

export const metadata = { title: "مكتبة الموارد" };

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const t = await getTranslations("admin.resources");
  const ta = await getTranslations("admin.activities");
  const supabase = await createClient();
  const [{ data: resources }, { data: cohorts }, { data: groups }] = await Promise.all([
    supabase.from("resources").select("id, type, title, description, category, url, storage_path, audience, resource_audiences(cohort_id, group_id)").order("sort_order"),
    supabase.from("cohorts").select("id, name").order("start_date", { ascending: false }),
    supabase.from("groups").select("id, name, cohorts(name)").order("name"),
  ]);
  const editing = edit ? resources?.find((r) => r.id === edit) : undefined;
  const groupOptions = (groups ?? []).map((g) => ({ id: g.id, label: `${g.cohorts?.name ?? ""} — ${g.name}` }));

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <Card aria-labelledby="resource-form">
        <CardTitle id="resource-form" className="mb-3">{editing ? t("edit") : t("new")}</CardTitle>
        <ResourceForm
          key={editing?.id ?? "new"}
          cohorts={cohorts ?? []}
          groups={groupOptions}
          draft={
            editing
              ? {
                  id: editing.id,
                  type: editing.type,
                  title: editing.title,
                  description: editing.description,
                  category: editing.category,
                  url: editing.url,
                  storagePath: editing.storage_path,
                  audience: editing.audience,
                  cohortIds: editing.resource_audiences.flatMap((a) => (a.cohort_id ? [a.cohort_id] : [])),
                  groupIds: editing.resource_audiences.flatMap((a) => (a.group_id ? [a.group_id] : [])),
                }
              : {}
          }
        />
      </Card>
      <Card aria-labelledby="resource-list" className="flex flex-col gap-3">
        <CardTitle id="resource-list">{t("title")}</CardTitle>
        {(resources ?? []).length === 0 && <EmptyState title={t("none")} />}
        <ul className="flex flex-col gap-2">
          {(resources ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand-200 px-3 py-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-ink-500">
                  {t(`types.${r.type}`)} · {t(`forAudience.${r.audience}`)} {r.storage_path && `· ${t("hasFile")}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/resources?edit=${r.id}`} className="inline-flex min-h-11 items-center text-sage-700 underline underline-offset-4">
                  {ta("edit")}
                </Link>
                <form action={deleteResource}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" variant="quiet">{t("delete")}</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {(resources ?? []).length > 1 && (
          <section aria-labelledby="resource-order" className="flex flex-col gap-2 border-t border-sand-100 pt-3">
            <h3 id="resource-order" className="font-medium">{t("order")}</h3>
            <ReorderList label={t("order")} items={(resources ?? []).map((r) => ({ id: r.id, label: r.title }))} onReorder={reorderResources} />
          </section>
        )}
      </Card>
    </>
  );
}
