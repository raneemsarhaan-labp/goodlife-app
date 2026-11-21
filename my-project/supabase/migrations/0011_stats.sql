-- 0011 «الإحصاءات»: member stats with streaks; facilitator group stats and per-member signals
-- (FR-035–FR-037, FR-043). Everything is computed from the raw records (FR-036).

-- Current and longest streak per habit of a user's journey. Current = the run ending today or
-- yesterday (a day is not "missed" until it is over). Internal.
create function habit_streaks(p_user uuid, p_cohort uuid)
returns table (habit_id uuid, current_streak int, longest_streak int)
language sql stable security definer set search_path = public as $$
  with hc as (
    select hc.habit_id, hc.local_date,
           hc.local_date - (row_number() over (partition by hc.habit_id order by hc.local_date))::int as grp
    from habit_completions hc join habits h on h.id = hc.habit_id join plans p on p.id = h.plan_id
    where p.user_id = p_user and p.cohort_id = p_cohort
  ), runs as (
    select habit_id, max(local_date) as last_day, count(*)::int as len from hc group by habit_id, grp
  )
  select habit_id,
         coalesce(max(len) filter (where last_day >= user_local_date(p_user) - 1), 0)::int,
         max(len)::int
  from runs group by habit_id;
$$;
revoke execute on function habit_streaks(uuid, uuid) from public, anon, authenticated;

-- The caller's stats for [p_from, p_to] in the current journey: period figures plus streaks.
create function member_stats(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v jsonb;
begin
  if v_user is null or v_cohort is null then return null; end if;
  v := period_figures(v_user, p_from, p_to);
  return v || jsonb_build_object('habits', coalesce((
    select jsonb_agg(h || jsonb_build_object('current_streak', coalesce(s.current_streak, 0),
                                             'longest_streak', coalesce(s.longest_streak, 0))
                     order by h ->> 'name')
    from jsonb_array_elements(v -> 'habits') h
    left join habit_streaks(v_user, v_cohort) s on s.habit_id = (h ->> 'habit_id')::uuid), '[]'::jsonb));
end $$;

-- Each member's membership window in the group, clipped to the period (members moved in or out
-- are counted only for their dates in this group).
create function group_windows(p_group uuid, p_from date, p_to date)
returns table (user_id uuid, d_from date, d_to date, active boolean)
language sql stable security definer set search_path = public as $$
  select gm.user_id, greatest(p_from, gm.started_on), least(p_to, coalesce(gm.ended_on, p_to)), gm.ended_on is null
  from group_memberships gm
  where gm.group_id = p_group and gm.role = 'member'
    and gm.started_on <= p_to and coalesce(gm.ended_on, p_to) >= p_from;
$$;
revoke execute on function group_windows(uuid, date, date) from public, anon, authenticated;

create function require_group_reader(p_group uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_group_facilitator(p_group) or is_admin()) then raise exception 'forbidden'; end if;
end $$;
revoke execute on function require_group_reader(uuid) from public, anon, authenticated;

-- Aggregates for a group: no habit names, challenges, or written content (FR-037).
create function group_stats(p_group uuid, p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cohort uuid; v_start date; v jsonb;
begin
  perform require_group_reader(p_group);
  select g.cohort_id, c.start_date into v_cohort, v_start from groups g join cohorts c on c.id = g.cohort_id where g.id = p_group;
  with w as (select * from group_windows(p_group, p_from, p_to)),
  per_member as (
    select w.user_id,
           sum(r.done_days)::numeric as done, sum(r.possible_days)::numeric as possible
    from w cross join lateral habit_rates(w.user_id, v_cohort, w.d_from, w.d_to) r
    group by w.user_id
  ),
  journey as (
    select coalesce(sum((select coalesce(sum(da.journey_done), 0) from daily_activity da
                         where da.user_id = w.user_id and da.cohort_id = v_cohort and da.local_date between w.d_from and w.d_to)), 0) as done,
           coalesce(sum((select count(*) from journey_challenges jc
                         where jc.journey_day between w.d_from - v_start + 1 and w.d_to - v_start + 1)), 0) as possible
    from w
  )
  select jsonb_build_object(
    'members', (select count(distinct user_id) from w),
    'avg_completion', (select avg(case when possible > 0 then done / possible else 0 end) from per_member),
    'journey_done', (select done from journey),
    'journey_possible', (select possible from journey),
    'active_7d', (select count(distinct w.user_id) from w
                  where w.active and exists (select 1 from daily_activity da
                                             where da.user_id = w.user_id and da.cohort_id = v_cohort
                                               and da.local_date >= user_local_date(w.user_id) - 6))
  ) into v;
  return v;
end $$;

-- Per current member: activity signals only (FR-043; constitution IV).
create function group_member_signals(p_group uuid, p_from date, p_to date)
returns table (user_id uuid, full_name text, last_active date, days_closed int, completion_rate numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_cohort uuid;
begin
  perform require_group_reader(p_group);
  select cohort_id into v_cohort from groups where id = p_group;
  return query
  select w.user_id, u.full_name,
         (select max(da.local_date) from daily_activity da where da.user_id = w.user_id and da.cohort_id = v_cohort),
         (select count(*)::int from daily_activity da
          where da.user_id = w.user_id and da.cohort_id = v_cohort and da.closed and da.local_date between w.d_from and w.d_to),
         (select case when sum(r.possible_days) > 0 then sum(r.done_days)::numeric / sum(r.possible_days) else 0 end
          from habit_rates(w.user_id, v_cohort, w.d_from, w.d_to) r)
  from group_windows(p_group, p_from, p_to) w join users u on u.id = w.user_id
  where w.active
  order by u.full_name;
end $$;

revoke execute on function member_stats(date, date), group_stats(uuid, date, date), group_member_signals(uuid, date, date) from public, anon;
grant execute on function member_stats(date, date), group_stats(uuid, date, date), group_member_signals(uuid, date, date) to authenticated;
