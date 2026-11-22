import "server-only";
import { cookies } from "next/headers";
import { log } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/onboarding";
import { invitationCodeSchema } from "@/lib/validation/onboarding";
import { fail, ok, type Result } from "@/server/actions/result";
import { runFinishJoin, type PendingJoin } from "@/server/join";

/** What a new member entered, held until they enter the code emailed to them (http-only, 30 min). */
const PENDING_COOKIE = "gl_join_pending";

export async function savePendingJoin(pending: PendingJoin): Promise<void> {
  (await cookies()).set(PENDING_COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/",
  });
}

async function readPendingJoin(): Promise<PendingJoin | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { code?: unknown; profile?: unknown };
    const code = invitationCodeSchema.safeParse(value.code);
    const profile = profileSchema.safeParse(value.profile);
    return code.success && profile.success ? { code: code.data, profile: profile.data } : null;
  } catch {
    return null;
  }
}

/**
 * Right after a code or link is verified: if this browser was in the middle of joining, redeem the
 * invitation for the account that just proved its email. "none" when there was nothing pending.
 */
export async function finishPendingJoin(): Promise<Result<"joined" | "none">> {
  const pending = await readPendingJoin();
  if (!pending) return ok("none");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!id || !email) return fail("forbidden");

  const admin = createAdminClient();
  const result = await runFinishJoin(
    {
      redeem: async (code, authUserId, p) =>
        admin.rpc("redeem_invitation", {
          p_code: code,
          p_auth_user: authUserId,
          p_full_name: p.fullName,
          p_email: p.email,
          p_time_zone: p.timeZone,
          p_phone: p.phone,
          p_gender: p.gender,
          p_city: p.city,
        }),
      clearPending: async () => {
        (await cookies()).delete({ name: PENDING_COOKIE, path: "/" });
      },
    },
    pending,
    { id, email },
  );
  if (!result.ok) {
    log.warn("join: could not redeem after verification", { error: result.error });
    return result;
  }
  return ok("joined");
}
