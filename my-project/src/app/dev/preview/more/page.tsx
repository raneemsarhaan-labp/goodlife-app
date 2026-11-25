import { notFound } from "next/navigation";
import { MoreView } from "@/components/features/more/MoreView";
import { BottomNav } from "@/components/ui/BottomNav";
import { SAMPLE_HEADER } from "../screens-sample";

export const metadata = { robots: { index: false } };

/** Development-only «المزيد» with sample data (design comparison); `?member=1` without the admin rows. */
export default async function MorePreview({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const member = (await searchParams).member === "1";
  return (
    <div className="pb-24">
      <MoreView
        header={SAMPLE_HEADER}
        user={{ fullName: "إسلام", roles: member ? ["member"] : ["member", "admin"], activeRole: member ? "member" : "admin" }}
        cohortName="الدفعة الثالثة"
      />
      <BottomNav current="/more" />
    </div>
  );
}
