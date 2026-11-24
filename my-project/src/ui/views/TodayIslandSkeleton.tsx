/** Server-rendered placeholder with the island's layout while Ionic loads (research §3). */
export function TodayIslandSkeleton() {
  return (
    <div className="flex flex-col gap-[14px]" aria-busy="true">
      <div className="td-skel td-skel-habits animate-pulse motion-reduce:animate-none" />
      <div className="td-skel td-skel-progress animate-pulse motion-reduce:animate-none" />
      <div className="td-skel td-skel-challenge animate-pulse motion-reduce:animate-none" />
    </div>
  );
}
