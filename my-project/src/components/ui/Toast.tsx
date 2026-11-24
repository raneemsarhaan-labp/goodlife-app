"use client";

/** Polite live region for calm status messages (saved, offline, pending). */
export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[100px] z-40 flex justify-center px-4">
      {message && (
        <p className="pointer-events-auto rounded-full bg-[var(--green-900)] px-[22px] py-3 text-[13px] font-bold text-white shadow-lg">{message}</p>
      )}
    </div>
  );
}
