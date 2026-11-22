import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_HABIT_ICON, HABIT_ICONS, habitIcon } from "@/ui/icons";

describe("habit icons", () => {
  it("match the database check constraint exactly", () => {
    const sql = readFileSync("supabase/migrations/0015_ui_versions.sql", "utf8");
    const inList = sql.match(/icon in \(([^)]+)\)/)![1]!.match(/'([a-z_]+)'/g)!.map((s) => s.slice(1, -1));
    expect([...HABIT_ICONS].sort()).toEqual(inList.sort());
  });
  it("match habit_icon_names() used by domains and the library (0017)", () => {
    const sql = readFileSync("supabase/migrations/0017_domains_habits.sql", "utf8");
    const body = sql.match(/select array\[([^\]]+)\]/)![1]!;
    const list = body.match(/'([a-z_]+)'/g)!.map((s) => s.slice(1, -1));
    expect([...HABIT_ICONS].sort()).toEqual(list.sort());
  });
  it("fall back to the default icon", () => {
    expect(habitIcon(null)).toBe(habitIcon(DEFAULT_HABIT_ICON));
    expect(habitIcon("unknown")).toBe(habitIcon(DEFAULT_HABIT_ICON));
    expect(habitIcon("menu_book").startsWith("data:image/svg+xml")).toBe(true);
  });
});
