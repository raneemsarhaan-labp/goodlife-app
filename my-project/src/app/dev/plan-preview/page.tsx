import { notFound } from "next/navigation";
import { DomainCards } from "@/components/features/plan/DomainCards";
import { IdentityCard } from "@/components/features/plan/IdentityCard";
import { ReviewDueCard } from "@/components/features/plan/ReviewDueCard";
import { ChallengeCards } from "@/components/features/today/ChallengeCards";
import type { LifeDomain } from "@/server/queries/domains";

export const metadata = { robots: { index: false } };

const faith: LifeDomain = { id: "00000000-0000-4000-8000-0000000d0001", key: "faith", name: "الصلة بالله", icon: "auto_stories", color: "violet", sort_order: 1, active: true };
const self: LifeDomain = { id: "00000000-0000-4000-8000-0000000d0002", key: "self", name: "النفس والبدن", icon: "self_improvement", color: "sage", sort_order: 2, active: true };

/** Development-only preview of spec 005 cards with sample data (screenshots and axe). */
export default function PlanPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6">
      <h1 className="text-2xl font-semibold">خطتي</h1>
      <ReviewDueCard nextReviewOn="2026-11-22" />
      <IdentityCard value="أنا ساعٍ إلى حياةٍ أهدأ، أرعى أهلي وأطلب العلم." />
      <DomainCards
        domains={[faith, self]}
        areas={[
          { id: "00000000-0000-4000-8000-0000000fa001", title: faith.name, description: "أن يكون لي وِردٌ لا أتركه.", sort_order: 1, domain_id: faith.id, sign: "أفتقد الوِرد إذا فاتني.", review_on: "2026-12-22" },
          { id: "00000000-0000-4000-8000-0000000fa002", title: self.name, description: null, sort_order: 2, domain_id: self.id, sign: null, review_on: null },
        ]}
        habits={[{ id: "00000000-0000-4000-8000-00000000d001", name: "وردي من القرآن", description: null, focus_area_id: "00000000-0000-4000-8000-0000000fa001", sort_order: 1 }]}
      />
      <ChallengeCards
        journey={null}
        own={null}
        localDate="2026-11-22"
        library={{ id: "x", title: "اقرأ صفحةً واحدةً وقف عند آية", prompt: "اسأل نفسك: لو عملتَ بها اليوم، ما الذي كان سيتغيّر؟", style: "action", habit_name: "اقرأ صفحةً وقف عند آية", domain: { id: faith.id, name: faith.name, icon: faith.icon, color: faith.color }, done: false, can_refresh: true }}
      />
    </main>
  );
}
