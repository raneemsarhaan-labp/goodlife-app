import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { finishRegistration } from "@/server/registration";

/**
 * Where a confirmation link lands, if the email template sends a link rather than the 6-digit code:
 * `?code=` (PKCE) or `?token_hash=&type=`. Then the member is registered and the app opens.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = await createClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (params.get("type") as EmailOtpType) ?? "signup" })
      : { error: new Error("missing token") };
  const target = request.nextUrl.clone();
  target.search = "";
  const registered = error ? null : await finishRegistration();
  if (error || !registered?.ok) {
    target.pathname = "/sign-in";
    target.searchParams.set("link", "expired");
  } else {
    target.pathname = registered.data === "registered" ? "/welcome" : "/";
  }
  return NextResponse.redirect(target);
}
