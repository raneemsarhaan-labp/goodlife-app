import { pageTitle } from "@/i18n/metadata";
import { GuidelinesView } from "@/components/features/resources/GuidelinesView";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = pageTitle("guidelines");

export default async function GuidelinesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("guidelines").select("number, text").order("number");
  return <GuidelinesView items={data ?? []} />;
}
