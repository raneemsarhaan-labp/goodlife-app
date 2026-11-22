-- 0017 Life domains, habit shape and the add-habit flow (spec 004). Forward-only.
-- See specs/004-domains-habit-flow/data-model.md and research.md §1–§7.

-- The curated habit icons (same list as the habits.icon check in 0015; src/ui/icons.ts).
create function habit_icon_names() returns text[]
language sql immutable parallel safe as $$
  select array['wb_sunny', 'menu_book', 'auto_stories', 'bedtime', 'nightlight', 'family_restroom', 'self_improvement',
               'directions_walk', 'fitness_center', 'water_drop', 'restaurant', 'no_food', 'block', 'favorite',
               'volunteer_activism', 'psychology', 'spa', 'edit_note', 'school', 'work', 'phone_disabled', 'mosque',
               'eco', 'schedule']
$$;

-- ── Life domains ───────────────────────────────────────────────────────────
create type domain_color as enum ('sage', 'dawn', 'gold', 'ink', 'violet');
create table life_domains (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z_]{2,30}$'),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  icon text not null default 'eco' check (icon = any (habit_icon_names())),
  color domain_color not null default 'sage',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger life_domains_updated_at before update on life_domains for each row execute function set_updated_at();
alter table life_domains enable row level security;
revoke all on life_domains from anon;
create policy life_domains_select on life_domains for select to authenticated using (true);
create policy life_domains_admin on life_domains for all to authenticated using (is_admin()) with check (is_admin());

insert into life_domains (key, name, icon, color, sort_order) values
  ('faith', 'الصلة بالله', 'auto_stories', 'violet', 1),
  ('self', 'النفس والبدن', 'self_improvement', 'sage', 2),
  ('family', 'العلاقات القريبة', 'family_restroom', 'dawn', 3),
  ('work', 'العمل والرزق', 'work', 'gold', 4),
  ('learning', 'العلم والتعلّم', 'menu_book', 'ink', 5),
  ('giving', 'الإسهام والنفع', 'volunteer_activism', 'dawn', 6),
  ('leisure', 'الترويح', 'spa', 'sage', 7);

-- ── Habit library («مكتبة العادات») ─────────────────────────────────────────
create table habit_library (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references life_domains (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  amount text check (char_length(amount) <= 60),
  hint text check (char_length(hint) <= 120),
  icon text check (icon is null or icon = any (habit_icon_names())),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index habit_library_domain on habit_library (domain_id, sort_order);
create trigger habit_library_updated_at before update on habit_library for each row execute function set_updated_at();
alter table habit_library enable row level security;
revoke all on habit_library from anon;
create policy habit_library_select on habit_library for select to authenticated using (active or is_admin());
create policy habit_library_admin on habit_library for all to authenticated using (is_admin()) with check (is_admin());

-- ── Plan domains: focus areas linked to a life domain, at most three per plan ─
alter table focus_areas add column domain_id uuid references life_domains (id) on delete set null;
create unique index focus_areas_plan_domain on focus_areas (plan_id, domain_id) where domain_id is not null;

create function focus_areas_domain_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.domain_id is not null and (
    select count(*) from focus_areas where plan_id = new.plan_id and domain_id is not null and id <> new.id
  ) >= 3 then
    raise exception 'limit_reached: a plan holds three domains';
  end if;
  return new;
end $$;
create trigger focus_areas_domain_cap before insert or update of domain_id on focus_areas
  for each row execute function focus_areas_domain_cap();

-- ── Habit shape ────────────────────────────────────────────────────────────
create type habit_time as enum ('morning', 'noon', 'evening', 'any');
alter table habits
  add column domain_id uuid references life_domains (id) on delete set null,
  add column amount text check (char_length(amount) <= 60),
  add column time_of_day habit_time not null default 'any',
  add column days smallint not null default 127 check (days between 1 and 127),
  add column library_habit_id uuid references habit_library (id) on delete set null;

-- A habit in a domain-linked focus area carries that domain (FR-004).
create function habits_domain_from_area() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_domain uuid;
begin
  if new.focus_area_id is not null then
    select domain_id into v_domain from focus_areas where id = new.focus_area_id;
    if v_domain is not null then new.domain_id := v_domain; end if;
  end if;
  return new;
end $$;
create trigger habits_domain_from_area before insert or update of focus_area_id, domain_id on habits
  for each row execute function habits_domain_from_area();

-- ── Schedule helpers (research §2–§3) ───────────────────────────────────────
-- Bit d of p_days = weekday d (0 Sunday … 6 Saturday).
create function habit_on(p_days smallint, p_date date) returns boolean
language sql immutable parallel safe as $$
  select ((p_days::int >> extract(dow from p_date)::int) & 1) = 1
$$;

-- Number of scheduled days from a fixed Sunday (1970-01-04) through p_date, inclusive.
create function scheduled_ord(p_days smallint, p_date date) returns int
language sql immutable parallel safe as $$
  select ((p_date - date '1970-01-04') / 7) * bit_count(p_days::int::bit(7))::int
       + bit_count((p_days::int & ((2 << ((p_date - date '1970-01-04') % 7)) - 1))::bit(7))::int
$$;

-- ── Schedule-aware figures ─────────────────────────────────────────────────
create or replace function habit_rates(p_user uuid, p_cohort uuid, p_from date, p_to date)
returns table (habit_id uuid, name text, done_days int, possible_days int, archived boolean)
language sql stable security definer set search_path = public as $$
  with u as (select time_zone as tz from users where id = p_user),
  c as (select start_date, end_date from cohorts where id = p_cohort),
  j as (select min(gm.started_on) as joined from group_memberships gm join groups g on g.id = gm.group_id
        where gm.user_id = p_user and g.cohort_id = p_cohort and gm.role = 'member'),
  h as (
    select h.id, h.name, h.days, h.archived_at is not null as archived,
      greatest(p_from, (select start_date from c), coalesce((select joined from j), p_from),
               least((h.created_at at time zone (select tz from u))::date,
                     coalesce((select min(x.local_date) from habit_completions x where x.habit_id = h.id), 'infinity'::date))) as d_from,
      least(p_to, (select end_date from c),
            coalesce((h.archived_at at time zone (select tz from u))::date, 'infinity'::date)) as d_to
    from habits h join plans p on p.id = h.plan_id
    where p.user_id = p_user and p.cohort_id = p_cohort
  )
  select h.id, h.name,
         (select count(*)::int from habit_completions hc
          where hc.habit_id = h.id and hc.local_date between h.d_from and h.d_to and habit_on(h.days, hc.local_date)),
         greatest(scheduled_ord(h.days, h.d_to) - scheduled_ord(h.days, h.d_from - 1), 0)::int,
         h.archived
  from h
  where h.d_to >= h.d_from;
$$;

-- Streaks run over scheduled days only: an unscheduled day never breaks one.
create or replace function habit_streaks(p_user uuid, p_cohort uuid)
returns table (habit_id uuid, current_streak int, longest_streak int)
language sql stable security definer set search_path = public as $$
  with hc as (
    select hc.habit_id, hc.local_date, h.days,
           scheduled_ord(h.days, hc.local_date) - (row_number() over (partition by hc.habit_id order by hc.local_date))::int as grp
    from habit_completions hc join habits h on h.id = hc.habit_id join plans p on p.id = h.plan_id
    where p.user_id = p_user and p.cohort_id = p_cohort and habit_on(h.days, hc.local_date)
  ), runs as (
    select habit_id, max(days) as days, max(local_date) as last_day, count(*)::int as len from hc group by habit_id, grp
  )
  select habit_id,
         coalesce(max(len) filter (where scheduled_ord(days, last_day) >= scheduled_ord(days, user_local_date(p_user) - 1)), 0)::int,
         max(len)::int
  from runs group by habit_id;
$$;

-- Habit detail (FR-007): the current week Saturday→Friday, done on scheduled days, streak.
drop function my_habit_details(date);
create function my_habit_details(p_date date)
returns table (habit_id uuid, week_done int, week_scheduled int, week jsonb, current_streak int)
language sql stable security definer set search_path = public as $$
  with w as (select p_date - ((extract(dow from p_date)::int + 1) % 7) as sat)
  select h.id,
         (select count(*)::int from habit_completions hc, w
          where hc.habit_id = h.id and hc.local_date between w.sat and w.sat + 6 and habit_on(h.days, hc.local_date)),
         (select count(*)::int from w, generate_series(0, 6) i where habit_on(h.days, w.sat + i)),
         (select jsonb_agg(jsonb_build_object(
                   'date', w.sat + i, 'scheduled', habit_on(h.days, w.sat + i),
                   'done', exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.local_date = w.sat + i))
                 order by i)
          from w, generate_series(0, 6) i),
         coalesce(s.current_streak, 0)
  from habits h join plans p on p.id = h.plan_id
  left join habit_streaks(auth.uid(), p.cohort_id) s on s.habit_id = h.id
  where p.user_id = auth.uid() and p.cohort_id = current_cohort_id(auth.uid());
$$;
revoke execute on function my_habit_details(date) from public, anon;
grant execute on function my_habit_details(date) to authenticated;

-- Totals count habits scheduled that day.
create or replace function set_habit_done(
  p_habit uuid, p_local_date date, p_done boolean, p_client_mutation_id uuid,
  p_recorded_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_owner uuid; v_cohort uuid; v_plan uuid;
begin
  select p.user_id, p.cohort_id, p.id into v_owner, v_cohort, v_plan
  from habits h join plans p on p.id = h.plan_id
  where h.id = p_habit and h.archived_at is null;
  if v_user is null or v_owner is distinct from v_user then raise exception 'not_found'; end if;
  perform assert_day_editable(v_user, v_cohort, p_local_date, p_recorded_at);

  if p_done then
    insert into habit_completions (habit_id, user_id, local_date, recorded_at, client_mutation_id)
    values (p_habit, v_user, p_local_date, p_recorded_at, p_client_mutation_id)
    on conflict do nothing;
  else
    delete from habit_completions where habit_id = p_habit and local_date = p_local_date;
  end if;

  return jsonb_build_object(
    'done_count', (select count(*) from habit_completions hc join habits h on h.id = hc.habit_id
                   where h.plan_id = v_plan and h.archived_at is null and hc.local_date = p_local_date
                     and habit_on(h.days, p_local_date)),
    'total', (select count(*) from habits where plan_id = v_plan and archived_at is null and habit_on(days, p_local_date))
  );
end $$;

-- ── Plan domains (+ / − in the add flow) ───────────────────────────────────
create function add_plan_domain(p_domain uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_plan uuid := current_plan_id(); v_id uuid; v_name text;
begin
  if v_plan is null then raise exception 'forbidden: no current plan'; end if;
  select id into v_id from focus_areas where plan_id = v_plan and domain_id = p_domain;
  if v_id is not null then return v_id; end if;
  select name into v_name from life_domains where id = p_domain and active;
  if v_name is null then raise exception 'not_found'; end if;
  insert into focus_areas (plan_id, title, domain_id, sort_order)
  values (v_plan, v_name, p_domain, coalesce((select max(sort_order) + 1 from focus_areas where plan_id = v_plan), 0))
  returning id into v_id;
  -- Habits of this domain outside any area move under it.
  update habits set focus_area_id = v_id where plan_id = v_plan and domain_id = p_domain and focus_area_id is null;
  return v_id;
end $$;

create function remove_plan_domain(p_domain uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_plan uuid := current_plan_id(); v_id uuid;
begin
  if v_plan is null then raise exception 'forbidden: no current plan'; end if;
  delete from focus_areas where plan_id = v_plan and domain_id = p_domain returning id into v_id;
  if v_id is null then raise exception 'not_found'; end if;
end $$;

revoke execute on function add_plan_domain(uuid), remove_plan_domain(uuid) from public, anon;
grant execute on function add_plan_domain(uuid), remove_plan_domain(uuid) to authenticated;

-- ── «يومك»: scheduled habits only, with shape and week ─────────────────────
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

