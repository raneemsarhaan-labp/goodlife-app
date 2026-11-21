/**
 * Invitation codes: 8 characters from an alphabet without look-alikes (no 0/O, 1/I/L),
 * matching data-model.md invitation_codes.code and the database check constraint.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;
export const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;

/** Cryptographically random code. Rejection sampling avoids modulo bias. */
export function generateCode(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const max = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let code = "";
  while (code.length < CODE_LENGTH) {
    for (const byte of random(new Uint8Array(16))) {
      if (byte < max && code.length < CODE_LENGTH) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
  }
  return code;
}

/** `count` distinct codes. */
export function generateCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateCode());
  return [...codes];
}
