"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { closingMessageSchema, encouragementPhraseSchema, journeyChallengeSchema, libraryChallengeSchema, libraryHabitSchema, lifeDomainSchema, quoteSchema, reviewQuestionSchema } from "@/lib/validation/admin";
import { fail, fromDbError, ok, type Result } from "../result";
import { currentAdmin, firstIssuePath, formObject } from "./guard";

type State = Result<null> | null;

/** Sets (or, with empty text, removes) the journey challenge for one journey day. */
export async function upsertJourneyChallenge(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = journeyChallengeSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const { journeyDay, text } = parsed.data;
  const { error } = text
    ? await supabase.from("journey_challenges").upsert({ journey_day: journeyDay, text }, { onConflict: "journey_day" })
    : await supabase.from("journey_challenges").delete().eq("journey_day", journeyDay);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

export async function upsertClosingMessage(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = closingMessageSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, active: parsed.data.active };
  const { error } = parsed.data.id
    ? await supabase.from("closing_messages").update(row).eq("id", parsed.data.id)
    : await supabase.from("closing_messages").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

export async function upsertReviewQuestion(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = reviewQuestionSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, sort_order: parsed.data.sortOrder, active: parsed.data.active };
  const { error } = parsed.data.id
    ? await supabase.from("review_questions").update(row).eq("id", parsed.data.id)
    : await supabase.from("review_questions").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

export async function upsertEncouragementPhrase(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = encouragementPhraseSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, sort_order: parsed.data.sortOrder, active: parsed.data.active };
  const { error } = parsed.data.id
    ? await supabase.from("encouragement_phrases").update(row).eq("id", parsed.data.id)
    : await supabase.from("encouragement_phrases").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

/** Adds or edits a daily quote for the opening ritual (spec 002 FR-031). */
export async function upsertQuote(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = quoteSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const supabase = await createClient();
  const row = { text: parsed.data.text, source: parsed.data.source ?? null, sort_order: parsed.data.sortOrder, active: parsed.data.active };
  const { error } = parsed.data.id ? await supabase.from("quotes").update(row).eq("id", parsed.data.id) : await supabase.from("quotes").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  return ok(null);
}

/** Renames, re-icons, reorders or hides a life domain (spec 004 FR-001). */
export async function saveLifeDomain(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = lifeDomainSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const { id, name, icon, color, sortOrder, active } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("life_domains").update({ name, icon, color, sort_order: sortOrder, active }).eq("id", id);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  revalidatePath("/habits/new");
  return ok(null);
}

/** Adds or edits a «مكتبة العادات» suggestion (spec 004 FR-009). */
export async function upsertLibraryHabit(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = libraryHabitSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const d = parsed.data;
  const row = { domain_id: d.domainId, name: d.name, amount: d.amount ?? null, hint: d.hint ?? null, icon: d.icon ?? null, sort_order: d.sortOrder, active: d.active };
  const supabase = await createClient();
  const { error } = d.id ? await supabase.from("habit_library").update(row).eq("id", d.id) : await supabase.from("habit_library").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  revalidatePath("/habits/new");
  return ok(null);
}

/** Adds or edits a «مكتبة التحدّيات» challenge (spec 005 FR-003). */
export async function upsertLibraryChallenge(_prev: State, formData: FormData): Promise<State> {
  if (!(await currentAdmin())) return fail("forbidden");
  const parsed = libraryChallengeSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail("invalid_input", firstIssuePath(parsed.error));
  const d = parsed.data;
  const row = { domain_id: d.domainId, style: d.style, title: d.title, prompt: d.prompt ?? null, habit_name: d.habitName ?? null, sort_order: d.sortOrder, active: d.active };
  const supabase = await createClient();
  const { error } = d.id ? await supabase.from("challenge_library").update(row).eq("id", d.id) : await supabase.from("challenge_library").insert(row);
  if (error) return fromDbError(error);
  revalidatePath("/admin/content");
  revalidatePath("/");
  return ok(null);
}
