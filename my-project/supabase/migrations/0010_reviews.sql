-- 0010 Monthly review «وقفة مع ما مضى»: review_questions, monthly_reviews, daily_activity,
-- habit_rates, month_figures, save_review (data-model.md; FR-030–FR-032, FR-036).

create type review_status as enum ('draft', 'completed');

create table review_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(btrim(text)) between 2 and 300),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete restrict,
  month date not null check (extract(day from month) = 1),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  figures_snapshot jsonb,
  status review_status not null default 'draft',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort_id, month),
  check ((status = 'completed') = (completed_at is not null))
);

create trigger review_questions_updated_at before update on review_questions for each row execute function set_updated_at();
create trigger monthly_reviews_updated_at before update on monthly_reviews for each row execute function set_updated_at();

alter table review_questions enable row level security;
alter table monthly_reviews enable row level security;
revoke all on review_questions, monthly_reviews from anon;
create policy review_questions_select on review_questions for select to authenticated using (true);
create policy review_questions_admin on review_questions for all to authenticated using (is_admin()) with check (is_admin());
create policy monthly_reviews_select_self on monthly_reviews for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on monthly_reviews from authenticated; -- written by save_review only

-- ── Shared derived data (all figures come from the raw records; FR-036) ────
-- One row per user, cohort, and date with any activity. SECURITY INVOKER: callers see only
-- what RLS lets them see; definer functions below use it for aggregates.
create view daily_activity with (security_invoker = true) as
with hc as (
  select hc.user_id, p.cohort_id, hc.local_date, count(*)::int as habits_done
  from habit_completions hc join habits h on h.id = hc.habit_id join plans p on p.id = h.plan_id
  group by 1, 2, 3
), cc as (
  select user_id, cohort_id, local_date,
         count(*) filter (where kind = 'journey')::int as journey_done,
         count(*) filter (where kind = 'own')::int as own_done
  from challenge_completions group by 1, 2, 3
), oc as (
  select user_id, cohort_id, local_date from own_challenges
), de as (
  select user_id, cohort_id, local_date, closed_at is not null as closed from day_entries
), keys as (
  select user_id, cohort_id, local_date from hc
  union select user_id, cohort_id, local_date from cc
  union select user_id, cohort_id, local_date from oc
  union select user_id, cohort_id, local_date from de
)
select k.user_id, k.cohort_id, k.local_date,
       coalesce(hc.habits_done, 0) as habits_done,
       coalesce(cc.journey_done, 0) as journey_done,
       coalesce(cc.own_done, 0) as own_done,
       (oc.user_id is not null) as own_written,
       coalesce(de.closed, false) as closed
from keys k
left join hc using (user_id, cohort_id, local_date)
left join cc using (user_id, cohort_id, local_date)
left join oc using (user_id, cohort_id, local_date)
left join de using (user_id, cohort_id, local_date);

-- Per-habit done days and possible days in [p_from, p_to] for a user's journey. A habit counts
-- from the latest of: the period start, the cohort start, the member's join date, and the habit's
-- creation (or first completion); and until the earliest of: the period end, the cohort end,
-- and the day it was archived. Internal: not executable by clients.
create function habit_rates(p_user uuid, p_cohort uuid, p_from date, p_to date)
returns table (habit_id uuid, name text, done_days int, possible_days int, archived boolean)
language sql stable security definer set search_path = public as $$
  with u as (select time_zone as tz from users where id = p_user),
  c as (select start_date, end_date from cohorts where id = p_cohort),
  j as (select min(gm.started_on) as joined from group_memberships gm join groups g on g.id = gm.group_id
        where gm.user_id = p_user and g.cohort_id = p_cohort and gm.role = 'member'),
  h as (
    select h.id, h.name, h.archived_at is not null as archived,
      greatest(p_from, (select start_date from c), coalesce((select joined from j), p_from),
               least((h.created_at at time zone (select tz from u))::date,
                     coalesce((select min(x.local_date) from habit_completions x where x.habit_id = h.id), 'infinity'::date))) as d_from,
      least(p_to, (select end_date from c),
            coalesce((h.archived_at at time zone (select tz from u))::date, 'infinity'::date)) as d_to
    from habits h join plans p on p.id = h.plan_id
    where p.user_id = p_user and p.cohort_id = p_cohort
  )
  select h.id, h.name,
         (select count(*)::int from habit_completions hc where hc.habit_id = h.id and hc.local_date between h.d_from and h.d_to),
         greatest(h.d_to - h.d_from + 1, 0)::int,
         h.archived
  from h
  where h.d_to >= h.d_from;
$$;
revoke execute on function habit_rates(uuid, uuid, date, date) from public, anon, authenticated;

-- Figures for the caller over [p_from, p_to] in their current journey (clamped to the journey
-- window and today). Used by monthly reviews and stats.
create function period_figures(p_user uuid, p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cohort cohorts; v_from date; v_to date; v_today date; v_habits jsonb; v_done int; v_possible int;
begin
  select c.* into v_cohort from cohorts c where c.id = current_cohort_id(p_user);
  if v_cohort.id is null then return null; end if;
  v_today := user_local_date(p_user);
  v_from := greatest(p_from, v_cohort.start_date);
  v_to := least(p_to, v_cohort.end_date, v_today);
  select coalesce(jsonb_agg(jsonb_build_object('habit_id', r.habit_id, 'name', r.name, 'done_days', r.done_days,
                                               'possible_days', r.possible_days, 'archived', r.archived) order by r.name), '[]'::jsonb),
         coalesce(sum(r.done_days), 0), coalesce(sum(r.possible_days), 0)
  into v_habits, v_done, v_possible
  from habit_rates(p_user, v_cohort.id, v_from, v_to) r;
  return jsonb_build_object(
    'from', v_from, 'to', v_to,
    'days', greatest(v_to - v_from + 1, 0),
    'habits', v_habits,
    'habits_done', v_done,
    'habits_possible', v_possible,
    'journey_total', (select count(*) from journey_challenges
                      where journey_day between v_from - v_cohort.start_date + 1 and v_to - v_cohort.start_date + 1),
    'journey_done', (select coalesce(sum(journey_done), 0) from daily_activity
                     where user_id = p_user and cohort_id = v_cohort.id and local_date between v_from and v_to),
    'own_written', (select count(*) from daily_activity
                    where user_id = p_user and cohort_id = v_cohort.id and own_written and local_date between v_from and v_to),
    'own_done', (select coalesce(sum(own_done), 0) from daily_activity
                 where user_id = p_user and cohort_id = v_cohort.id and local_date between v_from and v_to),
    'days_closed', (select count(*) from daily_activity
                    where user_id = p_user and cohort_id = v_cohort.id and closed and local_date between v_from and v_to)
  );
end $$;
revoke execute on function period_figures(uuid, date, date) from public, anon, authenticated;

-- The caller's figures for one calendar month (FR-031).
create function month_figures(p_month date) returns jsonb
language sql stable security definer set search_path = public as $$
  select period_figures(auth.uid(), date_trunc('month', p_month)::date,
                        (date_trunc('month', p_month) + interval '1 month')::date - 1)
         || jsonb_build_object('month', date_trunc('month', p_month)::date);
$$;

-- Save answers (p_answers: {question_id: answer}) as a draft, or complete the review with a
-- snapshot of the month's figures. Question text is copied, so later edits do not change it.
create function save_review(p_month date, p_answers jsonb, p_complete boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid());
  v_month date := date_trunc('month', p_month)::date; v_answers jsonb; v_existing monthly_reviews;
begin
  if v_user is null or v_cohort is null then raise exception 'forbidden'; end if;
  if v_month > date_trunc('month', user_local_date(v_user))::date then raise exception 'invalid_input: future month'; end if;
  select * into v_existing from monthly_reviews where user_id = v_user and cohort_id = v_cohort and month = v_month;
  if v_existing.status = 'completed' then raise exception 'conflict: review already completed'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('question_id', q.id, 'question_text', q.text,
                                               'answer', left(coalesce(p_answers ->> q.id::text, ''), 2000))
                            order by q.sort_order), '[]'::jsonb)
  into v_answers
  from review_questions q
  where q.active or (p_answers ? q.id::text);

  insert into monthly_reviews (user_id, cohort_id, month, answers, figures_snapshot, status, completed_at)
  values (v_user, v_cohort, v_month, v_answers,
          case when p_complete then month_figures(v_month) end,
          case when p_complete then 'completed'::review_status else 'draft' end,
          case when p_complete then now() end)
  on conflict (user_id, cohort_id, month) do update
    set answers = excluded.answers, figures_snapshot = excluded.figures_snapshot,
        status = excluded.status, completed_at = excluded.completed_at;
end $$;

revoke execute on function month_figures(date), save_review(date, jsonb, boolean) from public, anon;
grant execute on function month_figures(date), save_review(date, jsonb, boolean) to authenticated;
