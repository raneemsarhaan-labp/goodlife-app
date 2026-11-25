import { pageTitle } from "@/i18n/metadata";
import { ResourcesView } from "@/components/features/resources/ResourcesView";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = pageTitle("resources");

/** «الموارد» hub (US7, FR-050). Counts reflect only what the member may see (RLS). */
export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("type");
  const count = (type: string) => (data ?? []).filter((r) => r.type === type).length;
  return <ResourcesView counts={{ file: count("file"), recording: count("recording"), reference: count("reference") }} />;
}
