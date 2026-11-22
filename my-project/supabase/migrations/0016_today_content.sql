-- 0016 «يومك» content (spec 003): «حالي المنشود», «وقفة تأمل», multi-session activities with
-- registration, the registered-activity card, export. Forward-only; see specs/003-today-content/data-model.md.

-- ── Desired state ──────────────────────────────────────────────────────────
alter table plans add column desired_state text not null default ''
  check (char_length(desired_state) <= 2000);
grant update (desired_state) on plans to authenticated;

-- ── Reflections («وقفة تأمل») ───────────────────────────────────────────────
create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete cascade,
  local_date date not null,
  text text not null check (char_length(text) between 1 and 500),
  desired_state_snapshot text not null default '' check (char_length(desired_state_snapshot) <= 2000),
  client_mutation_id uuid not null unique,
  created_at timestamptz not null default now()
);
create index reflections_user_date on reflections (user_id, local_date desc, created_at desc);
alter table reflections enable row level security;
revoke all on reflections from anon, authenticated;
grant select, delete on reflections to authenticated;
-- Self only: no facilitator or admin access (constitution IV).
create policy reflections_select_self on reflections for select to authenticated using (user_id = auth.uid());
create policy reflections_delete_self on reflections for delete to authenticated using (user_id = auth.uid());

-- Saves a reflection for the caller (idempotent on p_client_mutation_id). p_local_date lets an
-- offline note keep its day if it arrives within 7 days; otherwise it is dated today.
create function add_reflection(p_text text, p_client_mutation_id uuid, p_local_date date default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_today date; v_cohort uuid; v_text text := btrim(coalesce(p_text, ''));
  v_id uuid; v_owner uuid;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  select id, user_id into v_id, v_owner from reflections where client_mutation_id = p_client_mutation_id;
  if v_id is not null then
    if v_owner <> v_user then raise exception 'forbidden'; end if;
    return v_id;
  end if;
  if char_length(v_text) not between 1 and 500 then raise exception 'invalid_input: reflection text'; end if;
  v_cohort := current_cohort_id(v_user);
  if v_cohort is null then raise exception 'forbidden: no current journey'; end if;
  v_today := user_local_date(v_user);
  insert into reflections (user_id, cohort_id, local_date, text, desired_state_snapshot, client_mutation_id)
  values (v_user, v_cohort,
          case when p_local_date between v_today - 7 and v_today then p_local_date else v_today end,
          v_text,
          coalesce((select desired_state from plans where user_id = v_user and cohort_id = v_cohort), ''),
          p_client_mutation_id)
  returning id into v_id;
  return v_id;
end $$;

-- Reflection history: «وقفة تأمل» notes and «ختام اليوم» reflections, newest first, for the
-- p_days days ending on p_before (default: the caller's today). SECURITY INVOKER: RLS applies.
create function my_reflections(p_before date default null, p_days int default 30)
returns table (local_date date, kind text, id uuid, text text, desired_state_snapshot text, created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  with bounds as (
    select coalesce(p_before, user_local_date(auth.uid())) as hi,
           coalesce(p_before, user_local_date(auth.uid())) - greatest(least(p_days, 366), 1) + 1 as lo
  )
  select r.local_date, 'pause', r.id, r.text, r.desired_state_snapshot, r.created_at
  from reflections r, bounds b
  where r.user_id = auth.uid() and r.local_date between b.lo and b.hi
  union all
  select d.local_date, 'closing', null, d.reflection, null, coalesce(d.closed_at, d.updated_at)
  from day_entries d, bounds b
  where d.user_id = auth.uid() and d.local_date between b.lo and b.hi and btrim(coalesce(d.reflection, '')) <> ''
  order by 1 desc, 6 desc
$$;

-- ── Activities: settings, sessions, link ───────────────────────────────────
create type activity_mode as enum ('in_person', 'online');
alter table activities
  add column registration_open boolean not null default false,
  add column capacity int check (capacity between 1 and 1000),
  add column mode activity_mode not null default 'in_person';

create table activity_sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  unique (activity_id, starts_at)
);
create index activity_sessions_starts on activity_sessions (starts_at);

create table activity_links (
  activity_id uuid primary key references activities (id) on delete cascade,
  meeting_url text not null check (meeting_url ~ '^https://' and char_length(meeting_url) <= 500)
);

-- Back-fill: every existing activity becomes one session.
insert into activity_sessions (activity_id, starts_at, ends_at) select id, starts_at, ends_at from activities;

-- activities.starts_at / ends_at = first session start / last session end (spec 001 queries keep working).
create function sync_activity_times() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_activity uuid := coalesce(new.activity_id, old.activity_id); v_first timestamptz; v_end timestamptz; v_n int;
begin
  select min(starts_at), count(*) into v_first, v_n from activity_sessions where activity_id = v_activity;
  if v_n = 0 then return null; end if;
  select case when v_n = 1 then max(ends_at) else max(coalesce(ends_at, starts_at)) end into v_end
  from activity_sessions where activity_id = v_activity;
  update activities set starts_at = v_first, ends_at = case when v_end > v_first then v_end end
  where id = v_activity and (starts_at, ends_at) is distinct from (v_first, case when v_end > v_first then v_end end);
  return null;
end $$;
create trigger activity_sessions_sync after insert or update or delete on activity_sessions
  for each row execute function sync_activity_times();

-- An activity inserted without sessions gets one from its own start and end.
create function activity_default_session() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into activity_sessions (activity_id, starts_at, ends_at) values (new.id, new.starts_at, new.ends_at)
  on conflict do nothing;
  return null;
end $$;
create trigger activities_default_session after insert on activities
  for each row execute function activity_default_session();

-- Organizer of the activity: admin, or a facilitator who created it and leads all its groups.
create function can_manage_activity(p_activity uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return is_admin() or (has_role('facilitator') and activity_created_by_me(p_activity) and activity_led_by_me(p_activity));
end $$;

-- May see the meeting link: organizers, facilitators of an audience group, registered members.
create function can_see_activity_link(p_activity uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return is_admin() or activity_created_by_me(p_activity)
    or exists (select 1 from activity_audiences aa where aa.activity_id = p_activity and aa.group_id is not null
               and is_group_facilitator(aa.group_id))
    or exists (select 1 from activity_registrations r where r.activity_id = p_activity
               and r.user_id = auth.uid() and r.cancelled_at is null);
end $$;

alter table activity_sessions enable row level security;
alter table activity_links enable row level security;
revoke all on activity_sessions, activity_links from anon;
create policy activity_sessions_select on activity_sessions for select to authenticated
  using (is_admin() or activity_created_by_me(activity_id) or can_see_activity(activity_id));
create policy activity_sessions_write on activity_sessions for all to authenticated
  using (can_manage_activity(activity_id)) with check (can_manage_activity(activity_id));
create policy activity_links_select on activity_links for select to authenticated
  using (can_see_activity_link(activity_id));
create policy activity_links_write on activity_links for all to authenticated
  using (can_manage_activity(activity_id)) with check (can_manage_activity(activity_id));

-- ── Registrations and the «يومك» card ──────────────────────────────────────
create table activity_registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (activity_id, user_id)
);
create index activity_registrations_user on activity_registrations (user_id) where cancelled_at is null;
alter table activity_registrations enable row level security;
revoke all on activity_registrations from anon, authenticated;
grant select on activity_registrations to authenticated;
-- Own rows, or all for admins. Facilitators use activity_registrations() (own groups only).
create policy activity_registrations_select on activity_registrations for select to authenticated
  using (user_id = auth.uid() or is_admin());

create table activity_card_dismissals (
  user_id uuid not null references users (id) on delete cascade,
  activity_id uuid not null references activities (id) on delete cascade,
  dismissed_on date not null,
  primary key (user_id, activity_id)
);
alter table activity_card_dismissals enable row level security;
revoke all on activity_card_dismissals from anon, authenticated;
grant select on activity_card_dismissals to authenticated;
create policy activity_card_dismissals_self on activity_card_dismissals for select to authenticated using (user_id = auth.uid());

-- Registration is possible while the activity is not cancelled and its last session has not started.
create function activity_window_open(p_activity uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select a.cancelled_at is null and a.registration_open
     and now() < (select max(s.starts_at) from activity_sessions s where s.activity_id = a.id)
  from activities a where a.id = p_activity
$$;

create function register_for_activity(p_activity uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_act activities; v_taken int;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  -- Row lock: competing registrations for the same activity run one at a time (capacity, FR-013).
  select * into v_act from activities where id = p_activity for update;
  if v_act.id is null or not can_see_activity(p_activity) then raise exception 'not_found'; end if;
  if not coalesce(activity_window_open(p_activity), false) then raise exception 'conflict: registration closed'; end if;
  if exists (select 1 from activity_registrations where activity_id = p_activity and user_id = v_user and cancelled_at is null) then
    return;
  end if;
  select count(*) into v_taken from activity_registrations where activity_id = p_activity and cancelled_at is null;
  if v_act.capacity is not null and v_taken >= v_act.capacity then raise exception 'limit_reached: activity is full'; end if;
  insert into activity_registrations (activity_id, user_id) values (p_activity, v_user)
  on conflict (activity_id, user_id) do update set cancelled_at = null, registered_at = now();
end $$;

create function cancel_activity_registration(p_activity uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  if not coalesce(activity_window_open(p_activity), false)
     and not exists (select 1 from activities where id = p_activity and cancelled_at is not null) then
    raise exception 'conflict: registration closed';
  end if;
  update activity_registrations set cancelled_at = now()
  where activity_id = p_activity and user_id = auth.uid() and cancelled_at is null returning id into v_id;
  if v_id is null then raise exception 'not_found'; end if;
  delete from activity_card_dismissals where activity_id = p_activity and user_id = auth.uid();
end $$;

create function dismiss_activity_card(p_activity uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  insert into activity_card_dismissals (user_id, activity_id, dismissed_on)
  values (auth.uid(), p_activity, user_local_date(auth.uid()))
  on conflict (user_id, activity_id) do update set dismissed_on = excluded.dismissed_on;
end $$;

-- Activity page for its audience and organizers: sessions, places, my registration, link if allowed.
create function activity_details(p_activity uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_act activities; v_taken int; v_mine boolean;
begin
  select * into v_act from activities where id = p_activity;
  if v_act.id is null or not (is_admin() or activity_created_by_me(p_activity) or can_see_activity(p_activity)) then
    raise exception 'not_found';
  end if;
  select count(*) into v_taken from activity_registrations where activity_id = p_activity and cancelled_at is null;
  v_mine := exists (select 1 from activity_registrations where activity_id = p_activity and user_id = auth.uid() and cancelled_at is null);
  return jsonb_build_object(
    'id', v_act.id, 'title', v_act.title, 'description', v_act.description, 'location', v_act.location,
    'mode', v_act.mode, 'registration_open', v_act.registration_open, 'capacity', v_act.capacity,
    'cancelled_at', v_act.cancelled_at,
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at,
                                  'past', coalesce(s.ends_at, s.starts_at + interval '2 hours') < now()) order by s.starts_at)
                          from activity_sessions s where s.activity_id = p_activity), '[]'::jsonb),
    'registered_count', v_taken,
    'places_left', case when v_act.capacity is null then null else greatest(v_act.capacity - v_taken, 0) end,
    'registered', v_mine,
    'window_open', coalesce(activity_window_open(p_activity), false),
    'can_manage', can_manage_activity(p_activity),
    'meeting_url', case when can_see_activity_link(p_activity)
                        then (select meeting_url from activity_links where activity_id = p_activity) end
  );
end $$;

-- Who registered: admins see everyone; facilitators only members of groups they lead (FR-017).
create function activity_registrations(p_activity uuid)
returns table (user_id uuid, full_name text, group_name text, registered_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_admin() or has_role('facilitator')) then raise exception 'forbidden'; end if;
  return query
    select r.user_id, u.full_name, g.name, r.registered_at
    from activity_registrations r
    join users u on u.id = r.user_id
    left join lateral (
      select gr.name, gm.group_id from group_memberships gm join groups gr on gr.id = gm.group_id
      where gm.user_id = r.user_id and gm.role = 'member' and gm.ended_on is null limit 1
    ) g on true
    where r.activity_id = p_activity and r.cancelled_at is null
      and (is_admin() or (g.group_id is not null and is_group_facilitator(g.group_id)))
    order by r.registered_at;
end $$;

-- Creates or edits an activity with its audience, sessions and registration settings.
-- SECURITY INVOKER: the activity, audience, session and link policies decide what the caller may do.
drop function save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid);
create function save_activity(
  p_id uuid default null, p_title text default null, p_description text default null,
  p_starts_at timestamptz default null, p_ends_at timestamptz default null,
  p_location text default null, p_group_ids uuid[] default null, p_cohort_id uuid default null,
  p_sessions jsonb default null, p_registration_open boolean default false, p_capacity int default null,
  p_mode activity_mode default 'in_person', p_meeting_url text default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid; v_sessions jsonb; v_first timestamptz; v_last_end timestamptz;
begin
  if (coalesce(array_length(p_group_ids, 1), 0) > 0) = (p_cohort_id is not null) then
    raise exception 'invalid_input: an activity has either groups or one cohort as its audience';
  end if;
  v_sessions := coalesce(p_sessions, jsonb_build_array(jsonb_build_object('starts_at', p_starts_at, 'ends_at', p_ends_at)));
  if jsonb_typeof(v_sessions) <> 'array' or jsonb_array_length(v_sessions) not between 1 and 52 then
    raise exception 'invalid_input: 1 to 52 sessions';
  end if;
  select min((s->>'starts_at')::timestamptz) into v_first from jsonb_array_elements(v_sessions) s;
  if v_first is null then raise exception 'invalid_input: session start'; end if;
  v_last_end := case when jsonb_array_length(v_sessions) = 1 then (v_sessions->0->>'ends_at')::timestamptz end;

  if p_id is null then
    insert into activities (title, description, starts_at, ends_at, location, created_by, registration_open, capacity, mode)
    values (btrim(p_title), nullif(btrim(p_description), ''), v_first, v_last_end,
            nullif(btrim(p_location), ''), auth.uid(), coalesce(p_registration_open, false), p_capacity, coalesce(p_mode, 'in_person'))
    returning id into v_id;
  else
    update activities
    set title = btrim(p_title), description = nullif(btrim(p_description), ''), location = nullif(btrim(p_location), ''),
        registration_open = coalesce(p_registration_open, false), capacity = p_capacity, mode = coalesce(p_mode, 'in_person')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'not_found'; end if;
    delete from activity_audiences where activity_id = v_id;
  end if;

  if p_cohort_id is not null then
    insert into activity_audiences (activity_id, cohort_id) values (v_id, p_cohort_id);
  else
    insert into activity_audiences (activity_id, group_id)
    select v_id, g from unnest(p_group_ids) as g group by g;
  end if;

  delete from activity_sessions where activity_id = v_id;
  insert into activity_sessions (activity_id, starts_at, ends_at)
  select v_id, (s->>'starts_at')::timestamptz, nullif(s->>'ends_at', '')::timestamptz
  from jsonb_array_elements(v_sessions) s
  on conflict (activity_id, starts_at) do nothing;

  if nullif(btrim(coalesce(p_meeting_url, '')), '') is null then
    delete from activity_links where activity_id = v_id;
  else
    insert into activity_links (activity_id, meeting_url) values (v_id, btrim(p_meeting_url))
    on conflict (activity_id) do update set meeting_url = excluded.meeting_url;
  end if;
  return v_id;
end $$;

-- ── «يومك»: upcoming activities by session, registered-activity cards ───────
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
               'done', exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.local_date = v_date),
               'week_done', coalesce(d.week_done, 0), 'current_streak', coalesce(d.current_streak, 0))
             order by h.sort_order, h.created_at)
      from habits h left join my_habit_details(v_date) d on d.habit_id = h.id
      where h.plan_id = v_plan and h.archived_at is null), '[]'::jsonb),
    'habits_total', (select count(*) from habits where plan_id = v_plan and archived_at is null),
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

-- ── Export (FR-007) ────────────────────────────────────────────────────────
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
                                                           'desired_state', p.desired_state, 'updated_at', p.updated_at)), '[]')
              from plans p where p.user_id = (select id from me)),
    'focus_areas', (select coalesce(jsonb_agg(jsonb_build_object('title', f.title, 'description', f.description)), '[]')
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

-- ── Function grants ────────────────────────────────────────────────────────
revoke execute on function add_reflection(text, uuid, date), my_reflections(date, int),
  register_for_activity(uuid), cancel_activity_registration(uuid), dismiss_activity_card(uuid),
  activity_details(uuid), activity_registrations(uuid),
  save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid, jsonb, boolean, int, activity_mode, text)
  from public, anon;
grant execute on function add_reflection(text, uuid, date), my_reflections(date, int),
  register_for_activity(uuid), cancel_activity_registration(uuid), dismiss_activity_card(uuid),
  activity_details(uuid), activity_registrations(uuid),
  save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid, jsonb, boolean, int, activity_mode, text)
  to authenticated;
