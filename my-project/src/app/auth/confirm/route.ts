import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the sign-in link in the email lands. The app asks for the 6-digit code, but Supabase's
 * default email template sends a link instead, so both work: `?code=` (PKCE, the default template)
 * and `?token_hash=&type=` (a custom template). Then on to the app, or back to sign-in.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = await createClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (params.get("type") as EmailOtpType) ?? "email" })
      : { error: new Error("missing token") };
  const target = request.nextUrl.clone();
  target.search = "";
  target.pathname = error ? "/sign-in" : "/";
  if (error) target.searchParams.set("link", "expired");
  return NextResponse.redirect(target);
}
