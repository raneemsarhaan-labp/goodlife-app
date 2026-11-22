-- 0019 «أثرك ← أنا» (spec 006): streaks with one forgiven miss a week, and member insights.
-- Everything is computed from completions and schedules (spec 001 FR-036). Forward-only.

-- Streaks over scheduled days with grace (product owner, 2026-11-22): one missed scheduled day per
-- Saturday–Friday week is forgiven while a streak is running; a second miss that week breaks it, and
-- it restarts quietly. Today is never "missed". Internal.
create function habit_streak_details(p_user uuid, p_cohort uuid)
returns table (habit_id uuid, current_streak int, longest_streak int, grace_this_week boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  h record; v_tz text; v_today date; v_start date; v_joined date; v_this_week date;
  v_done date[]; v_run int; v_best int; v_grace date; v_week date; d date; v_end date;
begin
  select time_zone into v_tz from users where id = p_user;
  v_today := user_local_date(p_user);
  v_this_week := v_today - ((extract(dow from v_today)::int + 1) % 7);
  select start_date into v_start from cohorts where id = p_cohort;
  select min(gm.started_on) into v_joined from group_memberships gm join groups g on g.id = gm.group_id
  where gm.user_id = p_user and g.cohort_id = p_cohort and gm.role = 'member';

  for h in
    select hb.id, hb.days, hb.created_at, hb.archived_at
    from habits hb join plans p on p.id = hb.plan_id
    where p.user_id = p_user and p.cohort_id = p_cohort
  loop
    select array_agg(local_date order by local_date) into v_done from habit_completions where habit_completions.habit_id = h.id;
    v_run := 0; v_best := 0; v_grace := null;
    d := greatest(v_start, coalesce(v_joined, v_start),
                  least((h.created_at at time zone v_tz)::date, coalesce(v_done[1], 'infinity'::date)));
    v_end := least(v_today, coalesce((h.archived_at at time zone v_tz)::date, v_today));
    while d <= v_end loop
      if habit_on(h.days, d) then
        if d = any (v_done) then
          v_run := v_run + 1;
          v_best := greatest(v_best, v_run);
        elsif d < v_today then
          v_week := d - ((extract(dow from d)::int + 1) % 7);
          if v_run > 0 and v_grace is distinct from v_week then
            v_grace := v_week;            -- forgiven: the streak goes on
          else
            v_run := 0;                   -- second miss this week (or no streak): restart
          end if;
        end if;
      end if;
      d := d + 1;
    end loop;
    habit_id := h.id; current_streak := v_run; longest_streak := v_best;
    grace_this_week := v_run > 0 and v_grace = v_this_week;
    return next;
  end loop;
end $$;
revoke execute on function habit_streak_details(uuid, uuid) from public, anon, authenticated;

-- Every existing caller («يومك» detail, stats) now follows the grace rule.
create or replace function habit_streaks(p_user uuid, p_cohort uuid)
returns table (habit_id uuid, current_streak int, longest_streak int)
language sql stable security definer set search_path = public as $$
  select habit_id, current_streak, longest_streak from habit_streak_details(p_user, p_cohort);
$$;

create or replace function member_stats(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v jsonb;
begin
  if v_user is null or v_cohort is null then return null; end if;
  v := period_figures(v_user, p_from, p_to);
  return v || jsonb_build_object('habits', coalesce((
    select jsonb_agg(h || jsonb_build_object('current_streak', coalesce(s.current_streak, 0),
                                             'longest_streak', coalesce(s.longest_streak, 0),
                                             'grace_this_week', coalesce(s.grace_this_week, false))
                     order by h ->> 'name')
    from jsonb_array_elements(v -> 'habits') h
    left join habit_streak_details(v_user, v_cohort) s on s.habit_id = (h ->> 'habit_id')::uuid), '[]'::jsonb));
end $$;

-- «أثرك ← أنا»: consecutive days, active habits, completion buckets, plan vs others, life areas.
create function member_insights(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_cohort cohorts; v_today date; v_from date; v_to date; v_n int;
  v_consec int := 0; d date;
begin
  if v_user is null then return null; end if;
  select c.* into v_cohort from cohorts c where c.id = current_cohort_id(v_user);
  if v_cohort.id is null then return null; end if;
  v_today := user_local_date(v_user);
  v_from := greatest(p_from, v_cohort.start_date);
  v_to := least(p_to, v_cohort.end_date, v_today);
  v_n := greatest(v_to - v_from + 1, 0);

  -- Days in a row with at least one habit done, ending today (or yesterday if today has none yet).
  d := v_today;
  if not exists (select 1 from habit_completions hc join habits h on h.id = hc.habit_id join plans p on p.id = h.plan_id
                 where hc.user_id = v_user and p.cohort_id = v_cohort.id and hc.local_date = d) then
    d := d - 1;
  end if;
  while exists (select 1 from habit_completions hc join habits h on h.id = hc.habit_id join plans p on p.id = h.plan_id
                where hc.user_id = v_user and p.cohort_id = v_cohort.id and hc.local_date = d) loop
    v_consec := v_consec + 1;
    d := d - 1;
  end loop;

  return jsonb_build_object(
    'from', v_from, 'to', v_to,
    'consecutive_days', v_consec,
    'active_habits', (select count(*) from habits h join plans p on p.id = h.plan_id
                      where p.user_id = v_user and p.cohort_id = v_cohort.id and h.archived_at is null),
    'plan_vs_other', (
      select jsonb_build_object(
        'plan_done', coalesce(sum(r.done_days) filter (where fa.domain_id is not null), 0),
        'plan_possible', coalesce(sum(r.possible_days) filter (where fa.domain_id is not null), 0),
        'other_done', coalesce(sum(r.done_days) filter (where fa.domain_id is null), 0),
        'other_possible', coalesce(sum(r.possible_days) filter (where fa.domain_id is null), 0))
      from habit_rates(v_user, v_cohort.id, v_from, v_to) r
      join habits h on h.id = r.habit_id left join focus_areas fa on fa.id = h.focus_area_id),
    -- Days for a week, Saturday-start weeks for a month, months for longer periods.
    'buckets', case when v_n = 0 then '[]'::jsonb else (
      with b as (
        select distinct case when v_n <= 7 then g::date
                             when v_n <= 31 then greatest(v_from, g::date - ((extract(dow from g)::int + 1) % 7))
                             else greatest(v_from, date_trunc('month', g)::date) end as b_from
        from generate_series(v_from, v_to, interval '1 day') g
      ), r as (
        select b_from,
               least(v_to, case when v_n <= 7 then b_from
                                when v_n <= 31 then b_from - ((extract(dow from b_from)::int + 1) % 7) + 6
                                else (date_trunc('month', b_from) + interval '1 month')::date - 1 end) as b_to
        from b
      )
      select jsonb_agg(jsonb_build_object('from', r.b_from, 'to', r.b_to,
               'done', (select coalesce(sum(done_days), 0) from habit_rates(v_user, v_cohort.id, r.b_from, r.b_to)),
               'possible', (select coalesce(sum(possible_days), 0) from habit_rates(v_user, v_cohort.id, r.b_from, r.b_to)))
             order by r.b_from)
      from r) end,
    'domains', (
      select coalesce(jsonb_agg(jsonb_build_object('id', ld.id, 'name', ld.name, 'icon', ld.icon, 'color', ld.color,
               'habits', (select count(*) from habits h join plans p on p.id = h.plan_id
                          where p.user_id = v_user and p.cohort_id = v_cohort.id and h.archived_at is null and h.domain_id = ld.id),
               'done', coalesce((select sum(r.done_days) from habit_rates(v_user, v_cohort.id, v_from, v_to) r
                                 join habits h on h.id = r.habit_id where h.domain_id = ld.id), 0),
               'possible', coalesce((select sum(r.possible_days) from habit_rates(v_user, v_cohort.id, v_from, v_to) r
                                     join habits h on h.id = r.habit_id where h.domain_id = ld.id), 0))
             order by ld.sort_order), '[]'::jsonb)
      from life_domains ld where ld.active)
  );
end $$;
revoke execute on function member_insights(date, date) from public, anon;
grant execute on function member_insights(date, date) to authenticated;
