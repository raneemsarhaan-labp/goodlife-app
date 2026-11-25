import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupLookForm } from "@/components/features/appearance/SetupLookForm";
import { AuthShell } from "@/components/features/auth/AuthShell";
import { EmailCodeForm } from "@/components/features/auth/EmailCodeForm";
import { WelcomeView } from "@/components/features/auth/WelcomeView";
import { SETUP_TOTAL, SetupFrame } from "@/components/features/setup/SetupFrame";
import { DesiredStep, DomainsStep, HabitsStep, StateStep } from "@/components/features/setup/SetupSteps";
import { SAMPLE_DOMAINS, SAMPLE_LIBRARY } from "../plan-sample";

export const metadata = { robots: { index: false } };

/**
 * Development-only entry screens with sample data, in the same frame as the (auth) pages:
 * `?screen=welcome` (`&done=1` setup finished, `&group=0` no group), `code`, `state`, `desired`,
 * `domains`, `habits`, `look`; `&from=today` opens a step from «يومك», `&error=code` shows a save error.
 * /sign-in and /join need no sign-in and are previewed on their own routes.
 */
export default async function AuthPreview({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string; from?: string; error?: string; done?: string; group?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  const fromToday = q.from === "today";
  const error = q.error?.slice(0, 60);
  const plan = SAMPLE_DOMAINS.slice(0, 3);
  let screen: React.ReactNode;
  switch (q.screen) {
    case "code":
      screen = (
        <main id="main" className="au-page">
          <EmailCodeForm identifier="salman@example.com" isEmail>
            <p className="au-switch">
              لديك حساب؟ <Link href="/sign-in">سجّل الدخول</Link>
            </p>
          </EmailCodeForm>
        </main>
      );
      break;
    case "state":
      screen = <StateStep text="" fromToday={fromToday} error={error} />;
      break;
    case "desired":
      screen = <DesiredStep text="" fromToday={fromToday} error={error} />;
      break;
    case "domains":
      screen = <DomainsStep domains={SAMPLE_DOMAINS} chosen={new Set(fromToday ? [plan[0]!.id] : [])} fromToday={fromToday} error={error} />;
      break;
    case "habits":
      screen = (
        <HabitsStep
          groups={plan.map((domain) => ({ domain, habits: SAMPLE_LIBRARY.filter((h) => h.domain_id === domain.id).slice(0, 4) })).filter((g) => g.habits.length)}
          fromToday={fromToday}
          error={error}
        />
      );
      break;
    case "look":
      screen = (
        <SetupFrame step={SETUP_TOTAL} title="كيف تحب أن يبدو تطبيقك؟" intro="اختر شكلًا يريحك. يمكنك تغييره متى شئت من «حسابي»." art={{ src: "/design/challenge-upcoming.webp" }} later={false} className="au-look">
          <SetupLookForm initial="journey" />
        </SetupFrame>
      );
      break;
    default:
      screen = <WelcomeView groupName={q.group === "0" ? null : "مجموعة النور"} setupPending={q.done !== "1"} href="/setup/state" />;
  }
  return <AuthShell>{screen}</AuthShell>;
}
