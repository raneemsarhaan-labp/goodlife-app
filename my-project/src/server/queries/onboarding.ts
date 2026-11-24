import "server-only";
import { createClient } from "@/lib/supabase/server";

/** «خطوات البداية»: which first steps the signed-in member has done (0026 onboarding_status). */
export type OnboardingStatus = {
  setup_completed: boolean;
  dismissed: boolean;
  look: boolean;
  current_state: boolean;
  desired_state: boolean;
  domains: boolean;
  habit: boolean;
  intention: boolean;
  closed_day: boolean;
};

export const ONBOARDING_STEPS = ["look", "current_state", "desired_state", "domains", "habit", "intention", "closed_day"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("onboarding_status");
  return error || !data ? null : (data as unknown as OnboardingStatus);
}
