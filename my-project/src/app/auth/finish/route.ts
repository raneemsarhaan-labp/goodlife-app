import { NextResponse, type NextRequest } from "next/server";
import { finishRegistration } from "@/server/registration";

/** After a link from an email signed the person in: register a new member, then open the app. */
export async function GET(request: NextRequest) {
  const registered = await finishRegistration();
  const target = request.nextUrl.clone();
  target.search = "";
  target.hash = "";
  if (!registered.ok) {
    target.pathname = "/sign-in";
    target.searchParams.set("link", "expired");
  } else {
    target.pathname = registered.data === "registered" ? "/welcome" : "/";
  }
  return NextResponse.redirect(target);
}
