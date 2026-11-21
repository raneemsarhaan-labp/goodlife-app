/** Server-rendered placeholder with the island's layout while Ionic loads (research §3). */
export function TodayIslandSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="gl-surface h-44 animate-pulse rounded-[var(--radius-card)] motion-reduce:animate-none" />
      <div className="gl-surface h-28 animate-pulse rounded-[var(--radius-card)] motion-reduce:animate-none" />
      <div className="gl-surface h-40 animate-pulse rounded-[var(--radius-card)] motion-reduce:animate-none" />
    </div>
  );
}
