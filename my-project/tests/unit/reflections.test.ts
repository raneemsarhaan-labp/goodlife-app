import { describe, expect, it } from "vitest";
import { desiredStateSchema, reflectionSchema, REFLECTION_MAX } from "@/lib/validation/reflections";

const id = "00000000-0000-4000-8000-00000000f001";

describe("«وقفة تأمل» validation (data-model.md reflections.text)", () => {
  it("trims and accepts a short note", () => {
    const r = reflectionSchema.parse({ text: "  أخذت وقتًا لنفسي  ", clientMutationId: id });
    expect(r.text).toBe("أخذت وقتًا لنفسي");
  });
  it("rejects empty or space-only text", () => {
    expect(reflectionSchema.safeParse({ text: "   ", clientMutationId: id }).success).toBe(false);
  });
  it(`limits text to ${REFLECTION_MAX} characters`, () => {
    expect(reflectionSchema.safeParse({ text: "ت".repeat(REFLECTION_MAX), clientMutationId: id }).success).toBe(true);
    expect(reflectionSchema.safeParse({ text: "ت".repeat(REFLECTION_MAX + 1), clientMutationId: id }).success).toBe(false);
  });
  it("needs an idempotency key and accepts an optional local date", () => {
    expect(reflectionSchema.safeParse({ text: "نص" }).success).toBe(false);
    expect(reflectionSchema.safeParse({ text: "نص", clientMutationId: id, localDate: "2026-11-20" }).success).toBe(true);
    expect(reflectionSchema.safeParse({ text: "نص", clientMutationId: id, localDate: "20-11-2026" }).success).toBe(false);
  });
});

describe("«حالي المنشود» validation (data-model.md plans.desired_state)", () => {
  it("allows empty (clears it) and up to 2,000 characters", () => {
    expect(desiredStateSchema.parse("")).toBe("");
    expect(desiredStateSchema.safeParse("أ".repeat(2000)).success).toBe(true);
    expect(desiredStateSchema.safeParse("أ".repeat(2001)).success).toBe(false);
  });
});
