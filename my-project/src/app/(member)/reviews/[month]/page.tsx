import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MonthFiguresView } from "@/components/features/review/MonthFiguresView";
import { ReviewForm } from "@/components/features/review/ReviewForm";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { localDate } from "@/lib/journey";
import { monthKeySchema } from "@/lib/validation/review";
import { requireUser } from "@/server/auth";
import { getReview } from "@/server/queries/reviews";

export const metadata = { title: "مراجعة الشهر" };

/** One month's review: figures first, then reflection questions; read-only once completed. */
export default async function ReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const user = await requireUser();
  const parsed = monthKeySchema.safeParse((await params).month);
  if (!parsed.success) notFound();
  const month = parsed.data;
  if (month > `${localDate(user.timeZone).slice(0, 7)}-01`) notFound();
  const [t, { review, figures, questions }] = await Promise.all([getTranslations("review"), getReview(month)]);
  const completed = review?.status === "completed";
  const shown = completed ? review?.figures_snapshot : figures;
  const name = new Intl.DateTimeFormat("ar-u-nu-arab", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T12:00:00Z`));
  const initial = Object.fromEntries((review?.answers ?? []).map((a) => [a.question_id, a.answer]));

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6">
      <header>
        <p className="text-sm text-ink-500">{t("subtitle")}</p>
        <h1 className="text-2xl font-semibold">{`${t("title")}: ${name}`}</h1>
      </header>
      {shown && (
        <Card aria-labelledby="figures">
          <CardTitle id="figures" className="mb-3">{t("figuresTitle")}</CardTitle>
          <MonthFiguresView figures={shown} />
          {completed && <p className="mt-3 text-sm text-ink-500">{t("snapshotNote")}</p>}
        </Card>
      )}
      <Card aria-labelledby="questions">
        <CardTitle id="questions" className="mb-3">{t("questionsTitle")}</CardTitle>
        {completed ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-sage-700">
              {t("completedOn", { date: formatDate(localDate(user.timeZone, new Date(review!.completed_at!)), { withYear: true }) })}
            </p>
            <dl className="flex flex-col gap-4">
              {review!.answers.map((a) => (
                <div key={a.question_id}>
                  <dt className="font-medium">{a.question_text}</dt>
                  <dd className="whitespace-pre-line text-ink-700">{a.answer || t("noAnswer")}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-ink-500">{t("readOnly")}</p>
          </div>
        ) : (
          <ReviewForm month={month.slice(0, 7)} questions={questions} initial={initial} />
        )}
      </Card>
    </main>
  );
}
