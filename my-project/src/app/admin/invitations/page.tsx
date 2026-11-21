import { pageTitle } from "@/i18n/metadata";
import { nowMs } from "@/lib/clock";
import { getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/features/admin/CopyButton";
import { InvitationForm } from "@/components/features/admin/InvitationForm";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatFraction } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";
import { revokeInvitation } from "@/server/actions/admin/invitations";
import { requireRole } from "@/server/auth";

export const generateMetadata = pageTitle("adminInvitations");

export default async function InvitationsPage() {
  const user = await requireRole("admin");
  const t = await getTranslations("admin.invitations");
  const supabase = await createClient();
  const [{ data: groups }, { data: codes }] = await Promise.all([
    supabase.from("groups").select("id, name, cohorts(name, start_date)").order("name"),
    supabase
      .from("invitation_codes")
      .select("id, code, uses, max_uses, expires_at, revoked_at, groups(name)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const options = (groups ?? [])
    .map((g) => ({ id: g.id, label: `${g.cohorts?.name ?? ""} — ${g.name}`, start: g.cohorts?.start_date ?? "" }))
    .sort((a, b) => b.start.localeCompare(a.start));
  const now = nowMs();
  const status = (c: NonNullable<typeof codes>[number]) =>
    c.revoked_at ? "revoked" : new Date(c.expires_at).getTime() <= now ? "expired" : c.uses >= c.max_uses ? "usedUp" : "active";

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-ink-700">{t("intro")}</p>
      <Card>
        <InvitationForm groups={options} />
      </Card>
      <Card aria-labelledby="codes" className="overflow-x-auto">
        <CardTitle id="codes" className="mb-3">{t("title")}</CardTitle>
        {(codes ?? []).length === 0 ? (
          <EmptyState title={t("none")} />
        ) : (
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="text-ink-500">
                <th scope="col" className="py-2 text-start font-medium">{t("code")}</th>
                <th scope="col" className="py-2 text-start font-medium">{t("group")}</th>
                <th scope="col" className="py-2 text-start font-medium">{t("uses")}</th>
                <th scope="col" className="py-2 text-start font-medium">{t("expires")}</th>
                <th scope="col" className="py-2 text-start font-medium">{t("status")}</th>
                <th scope="col"><span className="sr-only">{t("revoke")}</span></th>
              </tr>
            </thead>
            <tbody>
              {(codes ?? []).map((c) => {
                const s = status(c);
                return (
                  <tr key={c.id} className="border-t border-sand-100">
                    <td className="py-2"><span dir="ltr" className="font-mono">{c.code}</span> <CopyButton text={c.code} /></td>
                    <td className="py-2">{c.groups?.name}</td>
                    <td className="py-2">{formatFraction(c.uses, c.max_uses)}</td>
                    <td className="py-2">{formatDate(localDate(user.timeZone, new Date(c.expires_at)), { withWeekday: false, withYear: true })}</td>
                    <td className="py-2">{t(s)}</td>
                    <td className="py-2">
                      {s === "active" && (
                        <form action={revokeInvitation}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" variant="quiet">{t("revoke")}</Button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
