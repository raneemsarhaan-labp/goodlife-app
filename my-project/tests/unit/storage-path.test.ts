import { describe, expect, it } from "vitest";
import { storagePathFor } from "@/lib/validation/resources";

describe("storagePathFor", () => {
  it("uses a safe year/uuid.ext name, never the original file name", () => {
    const at = new Date(Date.UTC(2026, 10, 21));
    expect(storagePathFor("جلسة الأسبوع الأول.MP3", "abc-123", at)).toBe("2026/abc-123.mp3");
    expect(storagePathFor("../../etc/passwd", "id", at)).toMatch(/^2026\/id\.[a-z0-9]{1,8}$/);
    expect(storagePathFor("noext", "id", at)).toBe("2026/id.noext");
  });
});
