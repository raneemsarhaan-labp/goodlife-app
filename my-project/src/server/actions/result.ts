/** Error codes shared by all Server Actions (contracts/server-actions.md). */
export type ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "date_not_editable"
  | "code_invalid"
  | "code_expired"
  | "code_used_up"
  | "limit_reached"
  | "conflict";

export type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorCode; field?: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (error: ErrorCode, field?: string): { ok: false; error: ErrorCode; field?: string } => ({
  ok: false,
  error,
  field,
});

/** Error codes raised by our SQL functions (`raise exception '<code>'`). */
const SQL_CODES: ErrorCode[] = [
  "date_not_editable",
  "limit_reached",
  "code_invalid",
  "code_expired",
  "code_used_up",
  "forbidden",
  "not_found",
  "conflict",
  "invalid_input",
];

/** Maps a PostgREST/Postgres error to an ErrorCode. Never passes database messages to users. */
export function fromDbError(error: { code?: string; message?: string } | null) {
  const sqlCode = SQL_CODES.find((c) => error?.message?.includes(c));
  if (error?.code === "P0001" && sqlCode) return fail(sqlCode);
  switch (error?.code) {
    case "42501": // insufficient_privilege / RLS
      return fail("forbidden");
    case "23505": // unique_violation
      return fail("conflict");
    case "PGRST116": // no rows
      return fail("not_found");
    default:
      return fail("invalid_input");
  }
}
