import { AUTH_ICONS } from "./icons-auth.generated";

/** Icons only the sign-in, sign-up and «رحلة البداية» screens use (kept out of the shared icon module). */
export type AuthIconName = keyof typeof AUTH_ICONS;
export const authIcon = (name: AuthIconName): string => AUTH_ICONS[name];
