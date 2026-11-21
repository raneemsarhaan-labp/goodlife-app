import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "@/lib/log";

describe("log (constitution IV: no personal data in logs)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps only allow-listed, non-personal fields", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    log.info("join", { action: "completeJoin", code: "23505", email: "a@b.test", fullName: "اسم", intention: "نص خاص", count: 2 });
    const line = JSON.parse(String(spy.mock.calls[0]![0]));
    expect(line).toEqual({ level: "info", message: "join", action: "completeJoin", code: "23505", count: 2 });
  });

  it("drops objects even under allowed keys", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log.error("x", { error: { email: "a@b.test" } as unknown as string });
    expect(String(spy.mock.calls[0]![0])).not.toContain("a@b.test");
  });
});
