"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Links in our emails (and ones sent from the Supabase dashboard) put the session in the URL fragment
 * (#access_token=…), which the server never sees. Store it, then let the server finish: a new
 * member is registered (/auth/finish) before the app opens.
 */
export function LinkSession() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (hash.get("error_code") || hash.get("error")) {
      // An expired or already-used link.
      window.location.replace("/sign-in?link=expired");
      return;
    }
    if (!access_token || !refresh_token) return;
    void createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        window.location.replace(error ? "/sign-in?link=expired" : "/auth/finish");
      });
  }, []);
  return null;
}
