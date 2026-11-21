import { getRequestConfig } from "next-intl/server";

/** Arabic is the only locale (constitution I; spec: other languages out of scope). */
export const LOCALE = "ar";

export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import("../../messages/ar.json")).default,
  timeZone: "Asia/Riyadh",
}));
