/** Current time. Server components render once per request, so reading the clock here is safe. */
export const nowMs = (): number => Date.now();
