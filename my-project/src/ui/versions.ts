/**
 * The three visual versions (spec 002 FR-001). data-model.md `users.ui_version` stores the DB id
 * (`journey | glass | full_glass`); the DOM/cookie use the CSS id (`journey | glass | full-glass`).
 */
export type UiVersionDb = "journey" | "glass" | "full_glass";
export type UiVersion = "journey" | "glass" | "full-glass";

export const UI_COOKIE = "gl_ui";
export const DEFAULT_VERSION: UiVersion = "journey"; // FR-003: the only version without translucency

export type VersionInfo = {
  id: UiVersion;
  db: UiVersionDb;
  /** messages/ar.json › versions.<key> */
  key: "journey" | "glass" | "fullGlass";
  showsRitual: boolean;
  preview: string;
};

export const VERSIONS: VersionInfo[] = [
  { id: "journey", db: "journey", key: "journey", showsRitual: true, preview: "/ui/art-progress-journey.webp" },
  { id: "glass", db: "glass", key: "glass", showsRitual: false, preview: "/ui/bg-glass-828.webp" },
  { id: "full-glass", db: "full_glass", key: "fullGlass", showsRitual: true, preview: "/ui/bg-full-glass-828.webp" },
];

export const toDb = (v: UiVersion): UiVersionDb => (v === "full-glass" ? "full_glass" : v);
export const fromDb = (v: UiVersionDb): UiVersion => (v === "full_glass" ? "full-glass" : v);

export function parseVersion(value: string | null | undefined): UiVersion | null {
  return VERSIONS.find((v) => v.id === value)?.id ?? null;
}

/**
 * Which version to render (research §2): the account's choice once the person has chosen
 * (`ui_chosen_at` set); otherwise the device cookie; otherwise the default. Unknown values fall
 * back to the default (spec edge case: version removed).
 */
export function resolveVersion(
  profile: { ui_version: UiVersionDb; ui_chosen_at: string | null } | null,
  cookie: string | null | undefined,
): UiVersion {
  if (profile?.ui_chosen_at) return parseVersion(fromDb(profile.ui_version)) ?? DEFAULT_VERSION;
  return parseVersion(cookie) ?? DEFAULT_VERSION;
}
