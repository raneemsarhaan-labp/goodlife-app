"use client";

/** Polite live region for calm status messages (saved, offline, pending). */
export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      {message && (
        <p className="pointer-events-auto rounded-full bg-ink-900 px-5 py-2.5 text-sm text-white shadow-lg">{message}</p>
      )}
    </div>
  );
}
