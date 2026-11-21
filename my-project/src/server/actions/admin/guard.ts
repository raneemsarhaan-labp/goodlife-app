import "server-only";
import { getCurrentUser, type CurrentUser } from "@/server/auth";

/** Admin check for Server Actions (the database re-checks with require_admin / RLS). */
export async function currentAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.roles.includes("admin") ? user : null;
}

export function formObject(formData: FormData, arrays: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    out[key] = arrays.includes(key) ? formData.getAll(key).map(String) : formData.get(key);
  }
  for (const key of arrays) out[key] ??= [];
  return out;
}

export const firstIssuePath = (error: { issues: { path: PropertyKey[] }[] }) => String(error.issues[0]?.path[0] ?? "");
