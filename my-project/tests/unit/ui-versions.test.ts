import { describe, expect, it } from "vitest";
import { DEFAULT_VERSION, fromDb, parseVersion, resolveVersion, toDb, VERSIONS } from "@/ui/versions";

describe("visual versions", () => {
  it("has exactly three versions; only journey and full glass show the ritual", () => {
    expect(VERSIONS.map((v) => v.id)).toEqual(["journey", "glass", "full-glass"]);
    expect(VERSIONS.filter((v) => v.showsRitual).map((v) => v.id)).toEqual(["journey", "full-glass"]);
  });

  it("maps between database and DOM ids", () => {
    expect(toDb("full-glass")).toBe("full_glass");
    expect(fromDb("full_glass")).toBe("full-glass");
    expect(parseVersion("neon")).toBeNull();
  });

  it("defaults to «رحلة يومي»", () => {
    expect(DEFAULT_VERSION).toBe("journey");
    expect(resolveVersion(null, undefined)).toBe("journey");
  });

  it("uses the account choice once made, the cookie before that", () => {
    expect(resolveVersion({ ui_version: "glass", ui_chosen_at: "2026-11-21T10:00:00Z" }, "full-glass")).toBe("glass");
    expect(resolveVersion({ ui_version: "journey", ui_chosen_at: null }, "full-glass")).toBe("full-glass");
    expect(resolveVersion(null, "glass")).toBe("glass");
  });

  it("falls back to the default for unknown cookie values", () => {
    expect(resolveVersion(null, "retro")).toBe("journey");
  });
});
