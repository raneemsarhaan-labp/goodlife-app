/**
 * «عادة خاصّة» (spec 007 US4): the real name lives only on this device, in localStorage, keyed by the
 * habit id. The server keeps the placeholder. Every access is guarded (private mode, blocked storage).
 */
const KEY = "gl_private_habit_names";
export const PRIVATE_PLACEHOLDER = "عادة خاصّة";

type Store = Pick<Storage, "getItem" | "setItem">;
const store = (): Store | null => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

export function readPrivateNames(s: Store | null = store()): Record<string, string> {
  try {
    const raw = s?.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function savePrivateName(id: string, name: string, s: Store | null = store()): boolean {
  try {
    const all = readPrivateNames(s);
    all[id] = name.trim().slice(0, 80);
    s?.setItem(KEY, JSON.stringify(all));
    return Boolean(s);
  } catch {
    return false;
  }
}

/** The name to show: the device's private name when there is one, else what the server holds. */
export function displayName(id: string, serverName: string, isPrivate: boolean, names: Record<string, string>): string {
  return isPrivate ? (names[id] ?? serverName) : serverName;
}
