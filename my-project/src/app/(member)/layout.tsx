import { BottomNav } from "@/components/ui/BottomNav";
import { requireUser } from "@/server/auth";

/** Member shell: page content above a fixed bottom navigation (FR-082). */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
