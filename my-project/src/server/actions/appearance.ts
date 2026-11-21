"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { appearanceSchema } from "@/lib/validation/appearance";
import { getCurrentUser } from "@/server/auth";
import { toDb, UI_COOKIE, type UiVersion } from "@/ui/versions";
import { fail, fromDbError, ok, type Result } from "./result";

const ONE_YEAR = 60 * 60 * 24 * 400;

async function rememberOnDevice(version: UiVersion) {
  (await cookies()).set(UI_COOKIE, version, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ONE_YEAR, path: "/" });
}

/**
 * Save the chosen version (and optional ritual / reduce-transparency settings) on the account and
 * on this device (contracts/server-actions.md › Appearance; spec 002 FR-004, FR-005).
 */
export async function setAppearance(_prev: Result<null> | null, formData: FormData): Promise<Result<null> | null> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated");
  const parsed = appearanceSchema.safeParse({
    version: formData.get("version"),
    ritual: formData.has("ritualField") ? (formData.get("ritual") ?? "false") : undefined,
    reduceTransparency: formData.has("reduceTransparencyField") ? (formData.get("reduceTransparency") ?? "false") : undefined,
  });
  if (!parsed.success) return fail("invalid_input", "version");
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      ui_version: toDb(parsed.data.version),
      ui_chosen_at: user.uiChosenAt ?? new Date().toISOString(),
      ...(parsed.data.ritual === undefined ? {} : { ui_ritual: parsed.data.ritual }),
      ...(parsed.data.reduceTransparency === undefined ? {} : { ui_reduce_transparency: parsed.data.reduceTransparency }),
    })
    .eq("id", user.id);
  if (error) return fromDbError(error);
  await rememberOnDevice(parsed.data.version);
  revalidatePath("/", "layout");
  return ok(null);
}

/** Skip the setup step: keep the default version and stop inviting (FR-002, FR-003). */
export async function skipAppearanceChoice(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("users").update({ ui_chosen_at: user.uiChosenAt ?? new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/", "layout");
}

/** The opening quote card was used or closed: hide it for the rest of the day (FR-032). */
export async function dismissRitual(): Promise<Result<null>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_ritual_seen");
  if (error) return fromDbError(error);
  return ok(null);
}
