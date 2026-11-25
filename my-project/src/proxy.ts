import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Public routes; everything else requires a signed-in user (contracts/routes.md). */
const PUBLIC_PATHS = ["/join", "/sign-in", "/auth/confirm", "/auth/finish", ...(process.env.NODE_ENV === "development" ? ["/dev"] : [])];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Next.js 16: Middleware is called Proxy (src/proxy.ts). Optimistic check only;
// every page and action re-checks the user on the server (src/server/auth.ts).
export async function proxy(request: NextRequest) {
  // A confirmation link that landed on the Site URL instead of /auth/confirm: finish there.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/auth/confirm" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    return NextResponse.redirect(url);
  }
  const { response, signedIn } = await updateSession(request);
  if (!signedIn && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets, the service worker, manifest, and icons.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|swe-worker-.*|manifest.webmanifest|icons/|fonts/|ui/|design/).*)",
  ],
};
