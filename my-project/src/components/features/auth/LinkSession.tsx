"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * Emails sent from the Supabase dashboard (e.g. "Send password recovery") put the session in the
 * URL fragment (#access_token=…), which the server never sees. Store it, then open the app.
 */
export function LinkSession() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) return;
    void createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        window.location.replace(error ? "/sign-in?link=expired" : "/");
      });
  }, []);
  return null;
}
