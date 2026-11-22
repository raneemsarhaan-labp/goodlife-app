/** Decorative bar; the same value is always given as text next to it (WCAG 1.1.1). */
export function RateBar({ rate }: { rate: number }) {
  return (
    <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-sand-100">
      <span className="block h-full rounded-full bg-[var(--chart-mark)]" style={{ width: `${Math.round(Math.min(Math.max(rate, 0), 1) * 100)}%` }} />
    </span>
  );
}
