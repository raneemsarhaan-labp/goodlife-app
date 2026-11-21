import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MonthFigures = {
  month?: string;
  from: string;
  to: string;
  days: number;
  habits: { habit_id: string; name: string; done_days: number; possible_days: number; archived: boolean }[];
  habits_done: number;
  habits_possible: number;
  journey_total: number;
  journey_done: number;
  own_written: number;
  own_done: number;
  days_closed: number;
};

export type ReviewAnswer = { question_id: string; question_text: string; answer: string };

export async function getReviewStatuses(): Promise<Map<string, "draft" | "completed">> {
  const supabase = await createClient();
  const { data } = await supabase.from("monthly_reviews").select("month, status, cohort_id");
  return new Map((data ?? []).map((r) => [r.month, r.status]));
}

export async function getReview(month: string) {
  const supabase = await createClient();
  const [{ data: review }, { data: figures }, { data: questions }] = await Promise.all([
    supabase.from("monthly_reviews").select("status, answers, figures_snapshot, completed_at").eq("month", month).maybeSingle(),
    supabase.rpc("month_figures", { p_month: month }),
    supabase.from("review_questions").select("id, text").eq("active", true).order("sort_order"),
  ]);
  return {
    review: review as { status: "draft" | "completed"; answers: ReviewAnswer[]; figures_snapshot: MonthFigures | null; completed_at: string | null } | null,
    figures: figures as MonthFigures | null,
    questions: questions ?? [],
  };
}
