import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Public routes; everything else requires a signed-in user (contracts/routes.md). */
const PUBLIC_PATHS = ["/join", "/sign-in", ...(process.env.NODE_ENV === "development" ? ["/dev"] : [])];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Next.js 16: Middleware is called Proxy (src/proxy.ts). Optimistic check only;
// every page and action re-checks the user on the server (src/server/auth.ts).
export async function proxy(request: NextRequest) {
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
    "/((?!_next/static|_next/image|favicon.ico|sw.js|swe-worker-.*|manifest.webmanifest|icons/|fonts/|ui/).*)",
  ],
};
