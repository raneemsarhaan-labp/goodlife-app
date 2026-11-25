import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * For sending sign-up / sign-in emails only. Uses the implicit flow, so the link in the email carries
 * the session itself (#access_token=…) and works on any device or browser. The default (PKCE) link
 * only works in the browser that asked for it. Keeps no session of its own.
 */
export function createMailerClient() {
  return createSupabaseClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
