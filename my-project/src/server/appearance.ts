import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_VERSION, resolveVersion, UI_COOKIE, type UiVersion } from "@/ui/versions";
import { getCurrentUser } from "./auth";

export type Appearance = { version: UiVersion; reduceTransparency: boolean; saveData: boolean; ritual: boolean; chosen: boolean };

/** The appearance to render for this request (research §2): account → device cookie → default. */
export async function getAppearance(): Promise<Appearance> {
  const [user, cookieStore, headerList] = await Promise.all([getCurrentUser().catch(() => null), cookies(), headers()]);
  const version = user
    ? resolveVersion({ ui_version: user.uiVersion, ui_chosen_at: user.uiChosenAt }, cookieStore.get(UI_COOKIE)?.value)
    : resolveVersion(null, cookieStore.get(UI_COOKIE)?.value);
  return {
    version: version ?? DEFAULT_VERSION,
    reduceTransparency: Boolean(user?.uiReduceTransparency),
    saveData: headerList.get("save-data") === "on",
    ritual: user?.uiRitual ?? true,
    chosen: Boolean(user?.uiChosenAt),
  };
}
