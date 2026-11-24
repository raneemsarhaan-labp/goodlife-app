import "server-only";
import { createClient } from "@/lib/supabase/server";

/** The current plan's texts, for prefilling the setup steps. */
export async function getPlanTexts(): Promise<{ currentState: string; desiredState: string }> {
  const supabase = await createClient();
  const { data: planId } = await supabase.rpc("current_plan_id");
  if (!planId) return { currentState: "", desiredState: "" };
  const { data } = await supabase.from("plans").select("current_state, desired_state").eq("id", planId).maybeSingle();
  return { currentState: data?.current_state ?? "", desiredState: data?.desired_state ?? "" };
}
