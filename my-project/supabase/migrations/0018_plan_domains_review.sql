-- 0018 «خطتي» by domain, personal review rhythm, daily challenge by domain (spec 005). Forward-only.
-- See specs/005-plan-domains-review/data-model.md and research.md.

-- ── Plan texts ─────────────────────────────────────────────────────────────
alter table plans
  add column identity text not null default '' check (char_length(identity) <= 2000),
  add column next_review_on date,
  add column last_reviewed_at timestamptz;
grant update (identity) on plans to authenticated;

alter table focus_areas
  add column sign text check (char_length(sign) <= 300),
  add column review_on date;

-- The member's plan review: records it and sets the next date (tomorrow … one year ahead).
create function complete_plan_review(p_next date) returns void
language plpgsql security definer set search_path = public as $$
declare v_plan uuid := current_plan_id(); v_today date;
begin
  if v_plan is null then raise exception 'forbidden: no current plan'; end if;
  v_today := user_local_date(auth.uid());
  if p_next is null or p_next <= v_today or p_next > v_today + 365 then
    raise exception 'invalid_input: next review date';
  end if;
  update plans set next_review_on = p_next, last_reviewed_at = now() where id = v_plan;
end $$;

-- ── «مكتبة التحدّيات» ───────────────────────────────────────────────────────
create type challenge_style as enum ('action', 'reflection');
create table challenge_library (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references life_domains (id) on delete cascade,
  style challenge_style not null default 'action',
  title text not null check (char_length(btrim(title)) between 2 and 200),
  prompt text check (char_length(prompt) <= 300),
  habit_name text check (char_length(habit_name) <= 80),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index challenge_library_domain on challenge_library (domain_id) where active;
create trigger challenge_library_updated_at before update on challenge_library for each row execute function set_updated_at();
alter table challenge_library enable row level security;
revoke all on challenge_library from anon;
create policy challenge_library_select on challenge_library for select to authenticated using (active or is_admin());
create policy challenge_library_admin on challenge_library for all to authenticated using (is_admin()) with check (is_admin());

create table daily_challenge_refreshes (
  user_id uuid not null references users (id) on delete cascade,
  local_date date not null,
  refreshes smallint not null default 0 check (refreshes between 0 and 3),
  primary key (user_id, local_date)
);
alter table daily_challenge_refreshes enable row level security;
revoke all on daily_challenge_refreshes from anon, authenticated;
grant select on daily_challenge_refreshes to authenticated;
create policy daily_challenge_refreshes_self on daily_challenge_refreshes for select to authenticated using (user_id = auth.uid());

-- ── The day's challenge slot holds a journey or a library challenge ───────
alter table challenge_completions add column library_challenge_id uuid references challenge_library (id) on delete set null;
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'challenge_completions'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) like '%journey_challenge_id%'
  loop
    execute format('alter table challenge_completions drop constraint %I', c.conname);
  end loop;
end $$;
-- A journey or library source only in the journey slot (a removed library challenge leaves the
-- completion counted for its day); never both.
alter table challenge_completions add constraint challenge_completions_slot
  check (kind = 'journey' or (journey_challenge_id is null and library_challenge_id is null));
alter table challenge_completions add constraint challenge_completions_one_source
  check (journey_challenge_id is null or library_challenge_id is null);

-- Today's library challenge for a member (research §3): stable per day, from the plan's domains,
-- skipping ones completed in the 14 days before, at offset = refreshes. A library challenge already
-- completed that day is returned as is.
create function library_challenge_for(p_user uuid, p_date date) returns challenge_library
language plpgsql stable security definer set search_path = public as $$
declare v_plan uuid; v_domains uuid[]; v_refresh int; v_row challenge_library; v_n int; v_fresh boolean := true;
begin
  -- Members may only ask about themselves (the draw reveals plan domains; constitution IV).
  if auth.uid() is not null and p_user is distinct from auth.uid() then return null; end if;
  select cl.* into v_row from challenge_completions cc join challenge_library cl on cl.id = cc.library_challenge_id
  where cc.user_id = p_user and cc.local_date = p_date and cc.kind = 'journey' limit 1;
  if v_row.id is not null then return v_row; end if;

  select id into v_plan from plans where user_id = p_user and cohort_id = current_cohort_id(p_user);
  select array_agg(domain_id) into v_domains from focus_areas where plan_id = v_plan and domain_id is not null;
  select refreshes into v_refresh from daily_challenge_refreshes where user_id = p_user and local_date = p_date;

  select count(*) into v_n from challenge_library c
  where c.active and (v_domains is null or c.domain_id = any (v_domains))
    and not exists (select 1 from challenge_completions cc where cc.user_id = p_user and cc.library_challenge_id = c.id
                    and cc.local_date between p_date - 14 and p_date - 1);
  if v_n = 0 then
    v_fresh := false;
    select count(*) into v_n from challenge_library c where c.active and (v_domains is null or c.domain_id = any (v_domains));
  end if;
  if v_n = 0 then return null; end if;

  select c.* into v_row from challenge_library c
  where c.active and (v_domains is null or c.domain_id = any (v_domains))
    and (not v_fresh or not exists (select 1 from challenge_completions cc where cc.user_id = p_user and cc.library_challenge_id = c.id
                                    and cc.local_date between p_date - 14 and p_date - 1))
  order by md5(p_user::text || p_date::text || c.id::text)
  offset coalesce(v_refresh, 0) % v_n limit 1;
  return v_row;
end $$;
revoke execute on function library_challenge_for(uuid, date) from public, anon;
grant execute on function library_challenge_for(uuid, date) to authenticated;

-- ↻ «تحدٍّ آخر»: up to three times a day, only for a library challenge not yet done.
create function refresh_challenge() returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v_today date; v_start date;
begin
  if v_user is null or v_cohort is null then raise exception 'forbidden'; end if;
  v_today := user_local_date(v_user);
  select start_date into v_start from cohorts where id = v_cohort;
  if exists (select 1 from journey_challenges where journey_day = v_today - v_start + 1)
     or exists (select 1 from challenge_completions where user_id = v_user and cohort_id = v_cohort
                and local_date = v_today and kind = 'journey') then
    raise exception 'conflict: no refresh today';
  end if;
  insert into daily_challenge_refreshes (user_id, local_date, refreshes) values (v_user, v_today, 1)
  on conflict (user_id, local_date) do update set refreshes = daily_challenge_refreshes.refreshes + 1
  where daily_challenge_refreshes.refreshes < 3;
  if not found then raise exception 'limit_reached: three refreshes a day'; end if;
end $$;

-- Done/undone for the day's challenge slot: the journey challenge, else the library challenge.
create or replace function set_challenge_done(
  p_kind challenge_kind, p_local_date date, p_done boolean, p_client_mutation_id uuid,
  p_recorded_at timestamptz default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid());
  v_start date; v_journey uuid; v_library uuid; v_own uuid;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  perform assert_day_editable(v_user, v_cohort, p_local_date, p_recorded_at);
  if p_kind = 'journey' then
    select start_date into v_start from cohorts where id = v_cohort;
    select id into v_journey from journey_challenges where journey_day = p_local_date - v_start + 1;
    if v_journey is null then v_library := (library_challenge_for(v_user, p_local_date)).id; end if;
    if v_journey is null and v_library is null then raise exception 'not_found'; end if;
  else
    select id into v_own from own_challenges
    where user_id = v_user and cohort_id = v_cohort and local_date = p_local_date;
    if v_own is null then raise exception 'not_found'; end if;
  end if;

  if p_done then
    insert into challenge_completions (user_id, cohort_id, local_date, recorded_at, kind,
                                       journey_challenge_id, library_challenge_id, own_challenge_id, client_mutation_id)
    values (v_user, v_cohort, p_local_date, p_recorded_at, p_kind, v_journey, v_library, v_own, p_client_mutation_id)
    on conflict do nothing;
  else
    delete from challenge_completions
    where user_id = v_user and cohort_id = v_cohort and local_date = p_local_date and kind = p_kind;
  end if;
end $$;

revoke execute on function complete_plan_review(date), refresh_challenge() from public, anon;
grant execute on function complete_plan_review(date), refresh_challenge() to authenticated;

-- ── Figures: days with a challenge include library days ───────────────────
create or replace function period_figures(p_user uuid, p_from date, p_to date) returns jsonb
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
    -- Spec 005: a day has a challenge when the program wrote one or the library can supply one.
    'journey_total', case when exists (select 1 from challenge_library where active) then greatest(v_to - v_from + 1, 0)
                          else (select count(*) from journey_challenges
                                where journey_day between v_from - v_cohort.start_date + 1 and v_to - v_cohort.start_date + 1) end,
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

-- Aggregates for a group: no habit names, challenges, or written content (FR-037).
create or replace function group_stats(p_group uuid, p_from date, p_to date) returns jsonb
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
           coalesce(sum(case when exists (select 1 from challenge_library where active) then greatest(w.d_to - w.d_from + 1, 0)
                             else (select count(*) from journey_challenges jc
                                   where jc.journey_day between w.d_from - v_start + 1 and w.d_to - v_start + 1) end), 0) as possible
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


-- ── «يومك» ─────────────────────────────────────────────────────────────────
create or replace function get_today(p_which text default 'today') returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_tz text; v_date date; v_cohort cohorts; v_plan uuid; v_day int;
  v_status text;
begin
  select time_zone into v_tz from users where id = v_user;
  if v_tz is null then return null; end if;
  v_date := (now() at time zone v_tz)::date - case when p_which = 'yesterday' then 1 else 0 end;
  select c.* into v_cohort from cohorts c where c.id = current_cohort_id(v_user);
  if v_cohort.id is null then
    return jsonb_build_object('local_date', v_date, 'time_zone', v_tz, 'journey_status', 'none');
  end if;
  v_day := v_date - v_cohort.start_date + 1;
  v_status := case when v_day < 1 then 'not_started' when v_day > 365 then 'ended' else 'active' end;
  select id into v_plan from plans where user_id = v_user and cohort_id = v_cohort.id;

  return jsonb_build_object(
    'local_date', v_date,
    'time_zone', v_tz,
    'journey_day', least(greatest(v_day, 1), 365),
    'journey_status', v_status,
    'cohort', jsonb_build_object('id', v_cohort.id, 'name', v_cohort.name,
                                 'start_date', v_cohort.start_date, 'end_date', v_cohort.end_date),
    'desired_state', (select desired_state from plans where id = v_plan),
    'habits', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', h.id, 'name', h.name, 'description', h.description, 'icon', h.icon,
               'amount', h.amount, 'time_of_day', h.time_of_day, 'domain_id', h.domain_id,
               'done', exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.local_date = v_date),
               'week_done', coalesce(d.week_done, 0), 'week_scheduled', coalesce(d.week_scheduled, 0),
               'week', coalesce(d.week, '[]'::jsonb), 'current_streak', coalesce(d.current_streak, 0))
             order by case h.time_of_day when 'morning' then 0 when 'noon' then 1 when 'evening' then 2 else 3 end,
                      h.sort_order, h.created_at)
      from habits h left join my_habit_details(v_date) d on d.habit_id = h.id
      where h.plan_id = v_plan and h.archived_at is null and habit_on(h.days, v_date)), '[]'::jsonb),
    'habits_total', (select count(*) from habits where plan_id = v_plan and archived_at is null and habit_on(days, v_date)),
    'journey_challenge', (
      select jsonb_build_object('id', jc.id, 'text', jc.text,
               'done', exists (select 1 from challenge_completions cc
                               where cc.user_id = v_user and cc.cohort_id = v_cohort.id
                                 and cc.local_date = v_date and cc.kind = 'journey'))
      from journey_challenges jc where jc.journey_day = v_day),
    'own_challenge', (
      select jsonb_build_object('id', oc.id, 'text', oc.text,
               'done', exists (select 1 from challenge_completions cc
                               where cc.user_id = v_user and cc.cohort_id = v_cohort.id
                                 and cc.local_date = v_date and cc.kind = 'own'))
      from own_challenges oc
      where oc.user_id = v_user and oc.cohort_id = v_cohort.id and oc.local_date = v_date),
    -- Spec 005: the day's challenge from the library when the program has none for today.
    'library_challenge', (
      select jsonb_build_object('id', lc.id, 'title', lc.title, 'prompt', lc.prompt, 'style', lc.style,
               'habit_name', lc.habit_name,
               'domain', jsonb_build_object('id', d.id, 'name', d.name, 'icon', d.icon, 'color', d.color),
               'done', exists (select 1 from challenge_completions cc
                               where cc.user_id = v_user and cc.cohort_id = v_cohort.id
                                 and cc.local_date = v_date and cc.kind = 'journey'),
               'can_refresh', coalesce((select refreshes from daily_challenge_refreshes
                                        where user_id = v_user and local_date = v_date), 0) < 3
                              and not exists (select 1 from challenge_completions cc
                                              where cc.user_id = v_user and cc.cohort_id = v_cohort.id
                                                and cc.local_date = v_date and cc.kind = 'journey'))
      from library_challenge_for(v_user, v_date) lc join life_domains d on d.id = lc.domain_id
      where lc.id is not null and not exists (select 1 from journey_challenges jc where jc.journey_day = v_day)),
    'plan_review_due', (
      select p.next_review_on <= v_date
             or (p.next_review_on is null and (p.created_at at time zone v_tz)::date <= v_date - 30)
      from plans p where p.id = v_plan),
    'next_review_on', (select next_review_on from plans where id = v_plan),
    'day', (
      select jsonb_build_object('intention', de.intention, 'reflection', de.reflection, 'closed_at', de.closed_at)
      from day_entries de
      where de.user_id = v_user and de.cohort_id = v_cohort.id and de.local_date = v_date),
    -- Upcoming: the next session of each visible activity within 7 days (spec 001 FR-010, by session).
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'starts_at', n.starts_at,
                                          'ends_at', n.ends_at, 'location', a.location, 'mode', a.mode,
                                          'registration_open', a.registration_open)
             order by n.starts_at)
      from activities a
      cross join lateral (
        select s.starts_at, s.ends_at from activity_sessions s
        where s.activity_id = a.id and s.starts_at >= now() - interval '2 hours' and s.starts_at < now() + interval '7 days'
        order by s.starts_at limit 1) n
      where a.cancelled_at is null), '[]'::jsonb),
    -- Registered activities with a session still ahead (or cancelled today); visibility of the
    -- card is decided by the app from dismissed_on and next_local_date (research §9).
    'registered_activities', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'title', a.title, 'mode', a.mode,
               'next_starts_at', n.starts_at, 'next_ends_at', n.ends_at,
               'next_local_date', (n.starts_at at time zone v_tz)::date,
               'session_count', (select count(*) from activity_sessions s where s.activity_id = a.id),
               'cancelled', a.cancelled_at is not null,
               'dismissed_on', dm.dismissed_on)
             order by n.starts_at)
      from activity_registrations r
      join activities a on a.id = r.activity_id
      left join activity_card_dismissals dm on dm.user_id = v_user and dm.activity_id = a.id
      cross join lateral (
        select s.starts_at, s.ends_at from activity_sessions s
        where s.activity_id = a.id and coalesce(s.ends_at, s.starts_at + interval '2 hours') > now()
        order by s.starts_at limit 1) n
      where r.user_id = v_user and r.cancelled_at is null
        and (a.cancelled_at is null or (a.cancelled_at at time zone v_tz)::date = v_date)), '[]'::jsonb)
  );
end $$;


-- ── Export ─────────────────────────────────────────────────────────────────
create or replace function export_my_data() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id)
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(u) - 'notification_prefs' from users u where u.id = (select id from me)),
    'roles', (select coalesce(jsonb_agg(role), '[]') from user_roles where user_id = (select id from me)),
    'memberships', (select coalesce(jsonb_agg(jsonb_build_object('group', g.name, 'cohort', c.name, 'role', gm.role,
                                                                 'started_on', gm.started_on, 'ended_on', gm.ended_on)), '[]')
                    from group_memberships gm join groups g on g.id = gm.group_id join cohorts c on c.id = g.cohort_id
                    where gm.user_id = (select id from me)),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object('cohort_id', p.cohort_id, 'current_state', p.current_state,
                                                           'desired_state', p.desired_state, 'identity', p.identity,
                                                           'next_review_on', p.next_review_on, 'last_reviewed_at', p.last_reviewed_at,
                                                           'updated_at', p.updated_at)), '[]')
              from plans p where p.user_id = (select id from me)),
    'focus_areas', (select coalesce(jsonb_agg(jsonb_build_object('title', f.title, 'description', f.description, 'sign', f.sign,
                                                                 'review_on', f.review_on, 'domain', (select name from life_domains where id = f.domain_id))), '[]')
                    from focus_areas f join plans p on p.id = f.plan_id where p.user_id = (select id from me)),
    'habits', (select coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'description', h.description,
                                                            'archived_at', h.archived_at, 'created_at', h.created_at)), '[]')
               from habits h join plans p on p.id = h.plan_id where p.user_id = (select id from me)),
    'habit_completions', (select coalesce(jsonb_agg(jsonb_build_object('habit_id', habit_id, 'date', local_date)), '[]')
                          from habit_completions where user_id = (select id from me)),
    'day_entries', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'intention', intention,
                                                                 'reflection', reflection, 'closed_at', closed_at)), '[]')
                    from day_entries where user_id = (select id from me)),
    'reflections', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'text', text,
                                                                 'desired_state', desired_state_snapshot, 'created_at', created_at)
                                              order by created_at), '[]')
                    from reflections where user_id = (select id from me)),
    'own_challenges', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'text', text)), '[]')
                       from own_challenges where user_id = (select id from me)),
    'challenge_completions', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'kind', kind)), '[]')
                              from challenge_completions where user_id = (select id from me)),
    'monthly_reviews', (select coalesce(jsonb_agg(jsonb_build_object('month', month, 'status', status, 'answers', answers,
                                                                     'figures', figures_snapshot)), '[]')
                        from monthly_reviews where user_id = (select id from me)),
    'activity_registrations', (select coalesce(jsonb_agg(jsonb_build_object('activity', a.title, 'registered_at', r.registered_at,
                                                                            'cancelled_at', r.cancelled_at)), '[]')
                               from activity_registrations r join activities a on a.id = r.activity_id
                               where r.user_id = (select id from me)),
    'encouragements_received', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                                from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                                where e.recipient_id = (select id from me)),
    'encouragements_sent', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                            from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                            where e.sender_id = (select id from me))
  );
$$;

