import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  timeZone: string;
  activeRole: AppRole;
  roles: AppRole[];
  /** Appearance (spec 002, data-model.md users.ui_*). */
  uiVersion: Database["public"]["Enums"]["ui_version"];
  uiRitual: boolean;
  uiReduceTransparency: boolean;
  uiChosenAt: string | null;
};

/**
 * The signed-in user with profile and roles, or null. Verified on the server for every
 * request (constitution III). Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, time_zone, active_role, ui_version, ui_ritual, ui_reduce_transparency, ui_chosen_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    timeZone: profile.time_zone,
    activeRole: profile.active_role,
    roles: (roles ?? []).map((r) => r.role),
    uiVersion: profile.ui_version,
    uiRitual: profile.ui_ritual,
    uiReduceTransparency: profile.ui_reduce_transparency,
    uiChosenAt: profile.ui_chosen_at,
  };
});

/** For pages: signed-in user or redirect to sign-in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For pages: user holding `role`, else the "not available" page (404 hides existence). */
export async function requireRole(role: AppRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.roles.includes(role)) notFound();
  return user;
}

/** For pages: active facilitator of the group, or an admin; else 404. */
export async function requireGroupFacilitator(groupId: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.roles.includes("admin")) return user;
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("role", "facilitator")
    .is("ended_on", null)
    .maybeSingle();
  if (!data) notFound();
  return user;
}
