import { pageTitle } from "@/i18n/metadata";
import { WelcomeView } from "@/components/features/auth/WelcomeView";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("welcome");

export default async function WelcomePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("groups(name)")
    .eq("user_id", user.id)
    .eq("role", "member")
    .is("ended_on", null)
    .maybeSingle();
  return (
    <WelcomeView
      groupName={data?.groups?.name}
      setupPending={!user.setupCompletedAt}
      href={!user.setupCompletedAt ? "/setup/state" : user.uiChosenAt ? "/" : "/setup/look"}
    />
  );
}
