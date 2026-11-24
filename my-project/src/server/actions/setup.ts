"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { currentStateSchema } from "@/lib/validation/plan";
import { desiredStateSchema } from "@/lib/validation/reflections";
import { getCurrentUser } from "@/server/auth";

/**
 * «رحلة البداية» (setup after sign-up): current state → desired state → domains → first habits →
 * look. Each step saves what was given (nothing if skipped) and moves on; opened from «خطوات البداية»
 * on «يومك» (`from=today`), a step returns there instead.
 */
const STEPS = ["/setup/state", "/setup/desired", "/setup/domains", "/setup/habits"] as const;

async function next(formData: FormData, current: (typeof STEPS)[number]): Promise<never> {
  revalidatePath("/", "layout");
  if (formData.get("from") === "today") redirect("/");
  const i = STEPS.indexOf(current);
  const following = STEPS[i + 1];
  if (following) redirect(following);
  return finish();
}

/** The setup is over (finished or «أكمل لاحقًا»): the look step if not chosen yet, else «يومك». */
async function finish(): Promise<never> {
  const supabase = await createClient();
  await supabase.rpc("finish_setup");
  const user = await getCurrentUser();
  revalidatePath("/", "layout");
  redirect(user?.uiChosenAt ? "/" : "/setup/look");
}

export async function setupCurrentState(formData: FormData): Promise<void> {
  const text = currentStateSchema.safeParse(formData.get("text") ?? "");
  if (formData.get("intent") !== "skip" && text.success && text.data) {
    const supabase = await createClient();
    const { data: planId } = await supabase.rpc("current_plan_id");
    if (planId) await supabase.from("plans").update({ current_state: text.data }).eq("id", planId);
  }
  await next(formData, "/setup/state");
}

export async function setupDesiredState(formData: FormData): Promise<void> {
  const text = desiredStateSchema.safeParse(formData.get("text") ?? "");
  if (formData.get("intent") !== "skip" && text.success && text.data) {
    const supabase = await createClient();
    const { data: planId } = await supabase.rpc("current_plan_id");
    if (planId) await supabase.from("plans").update({ desired_state: text.data }).eq("id", planId);
  }
  await next(formData, "/setup/desired");
}

/** Adds the chosen domains to the plan (a plan holds three; extra choices are left out). */
export async function setupDomains(formData: FormData): Promise<void> {
  const ids = z.array(uuidSchema).safeParse(formData.getAll("domain").slice(0, 3));
  if (formData.get("intent") !== "skip" && ids.success) {
    const supabase = await createClient();
    for (const id of ids.data) await supabase.rpc("add_plan_domain", { p_domain: id });
  }
  await next(formData, "/setup/domains");
}

/** Adds the chosen library habits (daily, any time). */
export async function setupHabits(formData: FormData): Promise<void> {
  const ids = z.array(uuidSchema).safeParse(formData.getAll("habit").slice(0, 12));
  if (formData.get("intent") !== "skip" && ids.success && ids.data.length) {
    const supabase = await createClient();
    await supabase.rpc("add_library_habits", { p_ids: ids.data });
  }
  await next(formData, "/setup/habits");
}

/** «أكمل لاحقًا»: leave the setup now. */
export async function leaveSetup(): Promise<void> {
  await finish();
}

/** Hides «خطوات البداية» on «يومك». */
export async function dismissOnboarding(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("dismiss_onboarding");
  revalidatePath("/");
}
