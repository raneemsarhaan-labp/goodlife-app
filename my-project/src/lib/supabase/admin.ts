import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serviceRoleKey } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client. BYPASSES Row Level Security.
 * Allowed uses only: creating/deleting the auth user in `completeJoin`, and admin storage
 * uploads. Never import from client code; never use for reads on behalf of a user.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
