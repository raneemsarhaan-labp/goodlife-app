import { describe, expect, it } from "vitest";
import { displayName, PRIVATE_PLACEHOLDER, readPrivateNames, savePrivateName } from "@/lib/private-habits";

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("«عادة خاصّة» names on the device (spec 007 US4)", () => {
  it("stores and reads names by habit id", () => {
    const s = memory();
    savePrivateName("h1", "  دواءٌ قبل النوم ", s);
    expect(readPrivateNames(s)).toEqual({ h1: "دواءٌ قبل النوم" });
  });
  it("shows the device name only for private habits", () => {
    const names = { h1: "دواء" };
    expect(displayName("h1", PRIVATE_PLACEHOLDER, true, names)).toBe("دواء");
    expect(displayName("h2", PRIVATE_PLACEHOLDER, true, names)).toBe(PRIVATE_PLACEHOLDER);
    expect(displayName("h1", "مشي", false, names)).toBe("مشي");
  });
  it("survives broken storage", () => {
    const broken = { getItem: () => "{not json", setItem: () => { throw new Error("blocked"); } };
    expect(readPrivateNames(broken)).toEqual({});
    expect(savePrivateName("h1", "x", broken)).toBe(false);
    expect(readPrivateNames(null)).toEqual({});
  });
});
