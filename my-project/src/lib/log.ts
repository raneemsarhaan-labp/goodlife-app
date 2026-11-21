/**
 * Logger that never writes personal data (constitution IV). Only allow-listed, non-personal
 * fields are kept; names, emails, free text, and anything else are dropped.
 */
const SAFE_KEYS = new Set(["action", "code", "error", "status", "durationMs", "route", "count"]);

type Fields = Record<string, unknown>;

function scrub(fields: Fields = {}): Fields {
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SAFE_KEYS.has(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      out[k] = typeof v === "string" ? v.slice(0, 120) : v;
    }
  }
  return out;
}

export const log = {
  info(message: string, fields?: Fields) {
    console.info(JSON.stringify({ level: "info", message, ...scrub(fields) }));
  },
  warn(message: string, fields?: Fields) {
    console.warn(JSON.stringify({ level: "warn", message, ...scrub(fields) }));
  },
  error(message: string, fields?: Fields) {
    console.error(JSON.stringify({ level: "error", message, ...scrub(fields) }));
  },
};
