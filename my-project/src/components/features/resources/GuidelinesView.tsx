import { getTranslations } from "next-intl/server";
import { SubHeader } from "@/components/features/screens/ScreenHeader";

const two = (n: number) => new Intl.NumberFormat("ar-u-nu-arab", { minimumIntegerDigits: 2 }).format(n);

/** «أعراف الرحلة» as the design's sub-page: a short intro, then each norm with its number. Props only. */
export async function GuidelinesView({ items }: { items: { number: number; text: string }[] }) {
  const t = await getTranslations("resources");
  return (
    <main id="main" className="sc-page is-sub">
      <SubHeader title={t("guidelinesTitle")} subtitle={t("guidelinesSub")} backHref="/resources" />
      <div className="sc-content">
        <p className="sc-note" style={{ margin: "12.5px 0 8px" }}>{t("guidelinesIntro")}</p>
        {items.length === 0 ? (
          <p className="sc-text sc-muted">{t("noGuidelines")}</p>
        ) : (
          <ol className="sc-norms">
            {items.map((g) => (
              <li key={g.number} className="sc-norm">
                <span aria-hidden="true" className="sc-norm-num">{two(g.number)}</span>
                <p>{g.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
