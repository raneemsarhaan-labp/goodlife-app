import { getTranslations } from "next-intl/server";
import { switchRole } from "@/server/actions/account";
import type { AppRole } from "@/server/auth";

/** Shown only to people with more than one role (FR-004). */
export async function RoleSwitcher({ roles, active }: { roles: AppRole[]; active: AppRole }) {
  if (roles.length < 2) return null;
  const t = await getTranslations("account");
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-ink-700">{t("roleNow", { role: t(`roles.${active}`) })}</span>
      {roles
        .filter((r) => r !== active)
        .map((r) => (
          <form key={r} action={switchRole}>
            <input type="hidden" name="role" value={r} />
            <button type="submit" className="min-h-11 rounded-full px-3 text-sage-700 underline underline-offset-4 hover:bg-sage-50">
              {t("switchTo", { role: t(`roles.${r}`) })}
            </button>
          </form>
        ))}
    </div>
  );
}
