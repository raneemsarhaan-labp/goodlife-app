import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, CODE_PATTERN, generateCode, generateCodes } from "@/lib/codes";

describe("invitation codes", () => {
  it("are 8 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 500; i++) expect(generateCode()).toMatch(CODE_PATTERN);
  });

  it("never contain look-alike characters", () => {
    expect(CODE_ALPHABET).not.toMatch(/[01ILO]/);
    const joined = generateCodes(200).join("");
    expect(joined).not.toMatch(/[01ILO]/);
  });

  it("generates the requested number of distinct codes", () => {
    const codes = generateCodes(50);
    expect(codes).toHaveLength(50);
    expect(new Set(codes).size).toBe(50);
  });

  it("rejects biased bytes instead of wrapping them", () => {
    // 248..255 are above the largest multiple of 31 (248) and must be skipped.
    let call = 0;
    const fake = (b: Uint8Array) => {
      b.fill(call++ === 0 ? 255 : 0);
      return b;
    };
    expect(generateCode(fake)).toBe("AAAAAAAA");
  });
});
