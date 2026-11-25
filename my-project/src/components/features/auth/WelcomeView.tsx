import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/ui/components/Icon";
import { icon, navIcon } from "@/ui/icons";
import { habitIconThin } from "@/ui/icons-thin";

/**
 * «أهلًا بك»: the first screen after joining, as a designed moment in the language of «يومك» — the
 * logo badge and florist kicker of the opening quote card, a warm card with the plants-on-steps art,
 * the four parts of a day in the habit circles' tones, the member's group, and the way in.
 */
export async function WelcomeView({ groupName, setupPending, href }: { groupName?: string | null; setupPending: boolean; href: string }) {
  const [t, tc] = await Promise.all([getTranslations("welcome"), getTranslations("common")]);
  const day = [
    { key: "intent", text: t("dayIntent"), icon: "wb_sunny", tone: "tone-morning" },
    { key: "habits", text: t("dayHabits"), icon: "eco", tone: "tone-noon" },
    { key: "challenge", text: t("dayChallenge"), icon: "directions_walk", tone: "tone-evening" },
    { key: "close", text: t("dayClose"), icon: "bedtime", tone: "tone-close" },
  ];
  return (
    <main id="main" className="au-page">
      <div className="au-content">
        <section aria-labelledby="welcome-title" className="au-hero">
          <span className="au-badge">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative logo badge */}
            <img src="/design/logo.webp" alt="" width={72} height={72} />
          </span>
          <p className="au-hero-kicker" aria-hidden="true">
            <i />
            <Icon src={icon("local_florist")} />
            <span>{tc("appName")}</span>
            <Icon src={icon("local_florist")} />
            <i />
          </p>
          <h1 id="welcome-title" className="au-hero-title">
            {t("title")}
          </h1>
          <p className="au-hero-body">{t("body")}</p>
          <div className="au-hero-art" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative illustration */}
            <img src="/design/challenge-journey.webp" alt="" width={176} height={176} />
          </div>
        </section>

        <section aria-labelledby="welcome-day" className="au-card">
          <h2 id="welcome-day" className="au-day-title">
            {t("dayTitle")}
          </h2>
          <ul className="au-day">
            {day.map((d) => (
              <li key={d.key} className={d.tone}>
                <span className="au-day-circle" aria-hidden="true">
                  <Icon src={habitIconThin(d.icon)} />
                </span>
                {d.text}
              </li>
            ))}
          </ul>
        </section>

        {groupName && (
          <div className="au-group">
            <span className="au-group-icon" aria-hidden="true">
              <Icon src={navIcon("groups")} />
            </span>
            <p className="au-group-text">
              <span className="au-group-label">{t("groupLabel")}</span>
              <strong className="au-group-name">{groupName}</strong>
            </p>
          </div>
        )}

        {setupPending && (
          <p className="au-note">
            <Icon src={icon("eco")} />
            <span>{t("setupNote")}</span>
          </p>
        )}

        <Link href={href} className="af-next is-link au-cta">
          {t("start")}
          <Icon src={icon("arrow_back")} />
        </Link>
      </div>
    </main>
  );
}
