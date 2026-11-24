import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

/**
 * «عاداتي اليومية» before the first habit: the same card as the habit row, with an «أضف عادة»
 * circle where the habits will be.
 */
export async function EmptyHabits() {
  const t = await getTranslations("today");
  return (
    <section aria-labelledby="habits-empty" className="td-card td-habits">
      <div className="td-card-head">
        <h2 id="habits-empty" className="td-card-title">{t("habitsTitle")}</h2>
      </div>
      <div className="td-empty-row">
        <Link href="/habits/new" className="td-avatar tone-any">
          <span className="td-circle is-add">
            <Icon src={icon("add")} />
          </span>
          <span className="td-avatar-label">{t("addHabit")}</span>
        </Link>
        <div>
          <p className="td-empty-title">{t("noHabitsTitle")}</p>
          <p className="td-empty-body">{t("noHabitsBody")}</p>
        </div>
      </div>
    </section>
  );
}
