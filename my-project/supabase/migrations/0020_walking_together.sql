-- 0020 Walking together (spec 007): habit sharing and private habits, group status and tool toggles,
-- activity presenter, group challenges (no ranking), community activity list. Forward-only.

-- ── Habit flags ────────────────────────────────────────────────────────────
alter table habits
  add column shared_with_group boolean not null default false,
  add column is_private boolean not null default false,
  add constraint habits_private_not_shared check (not (is_private and shared_with_group));

-- ── Groups: status and tool toggles; activities: presenter ────────────────
create type group_status as enum ('open', 'closed');
alter table groups
  add column status group_status not null default 'open',
  add column features jsonb not null default '{"sharing": true, "encouragement": true, "challenges": true}'::jsonb;
alter table activities add column presenter text check (char_length(presenter) <= 120);

-- Feature flag of a group (missing keys count as on).
create function group_feature(p_group uuid, p_feature text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (features ->> p_feature)::boolean from groups where id = p_group), true)
$$;

-- The caller's active member group (facilitator memberships are not "my group" here).
create function my_member_group() returns uuid
language sql stable security definer set search_path = public as $$
  select group_id from group_memberships where user_id = auth.uid() and role = 'member' and ended_on is null limit 1
$$;

-- ── Group challenges ──────────────────────────────────────────────────────
create table group_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text check (char_length(description) <= 1000),
  domain_id uuid references life_domains (id) on delete set null,
  habit_name text not null check (char_length(btrim(habit_name)) between 1 and 80),
  amount text check (char_length(amount) <= 60),
  days smallint not null default 127 check (days between 1 and 127),
  starts_on date not null,
  duration_days int not null check (duration_days between 3 and 90),
  cohort_id uuid references cohorts (id) on delete cascade,
  group_id uuid references groups (id) on delete cascade,
  created_by uuid references users (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(cohort_id, group_id) = 1)
);
create trigger group_challenges_updated_at before update on group_challenges for each row execute function set_updated_at();

create table group_challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references group_challenges (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  habit_id uuid references habits (id) on delete set null,
  joined_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (challenge_id, user_id)
);
alter table habits add column group_challenge_id uuid references group_challenges (id) on delete set null;

create function can_see_group_challenge(p_challenge uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_challenges gc
    where gc.id = p_challenge and gc.cancelled_at is null
      and ((gc.cohort_id is not null and is_active_in_cohort(gc.cohort_id))
        or (gc.group_id is not null and is_group_member(gc.group_id)))
  )
$$;

alter table group_challenges enable row level security;
alter table group_challenge_participants enable row level security;
revoke all on group_challenges, group_challenge_participants from anon;
revoke insert, update, delete on group_challenge_participants from authenticated;
create policy group_challenges_select on group_challenges for select to authenticated
  using (is_admin() or can_see_group_challenge(id));
create policy group_challenges_admin on group_challenges for all to authenticated using (is_admin()) with check (is_admin());
-- Own participation only; aggregates come from my_group_challenges() (no names, no ranks).
create policy group_challenge_participants_self on group_challenge_participants for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- The challenge's habit is fixed: name, amount, days and time cannot be changed by the member.
create function habits_challenge_locked() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.group_challenge_id is not null
     and (new.name, new.amount, new.days, new.time_of_day, new.group_challenge_id)
         is distinct from (old.name, old.amount, old.days, old.time_of_day, old.group_challenge_id)
     and current_setting('goodlife.challenge_admin', true) is distinct from 'on' then
    raise exception 'forbidden: the challenge habit is fixed';
  end if;
  return new;
end $$;
create trigger habits_challenge_locked before update on habits for each row execute function habits_challenge_locked();

-- «انضمّ»: creates the locked habit in the member's current plan (or restores it after a withdrawal).
create function join_group_challenge(p_challenge uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v group_challenges; v_today date; v_plan uuid; v_group uuid;
  v_part group_challenge_participants; v_habit uuid;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  select * into v from group_challenges where id = p_challenge;
  if v.id is null or not can_see_group_challenge(p_challenge) then raise exception 'not_found'; end if;
  v_group := my_member_group();
  if v_group is null or not group_feature(v_group, 'challenges') then raise exception 'forbidden'; end if;
  v_today := user_local_date(v_user);
  if v_today >= v.starts_on + v.duration_days then raise exception 'conflict: challenge ended'; end if;
  v_plan := current_plan_id();
  if v_plan is null then raise exception 'forbidden: no current plan'; end if;

  select * into v_part from group_challenge_participants where challenge_id = p_challenge and user_id = v_user;
  if v_part.id is not null and v_part.withdrawn_at is null then return v_part.habit_id; end if;
  if v_part.habit_id is not null then
    update habits set archived_at = null where id = v_part.habit_id;
    update group_challenge_participants set withdrawn_at = null, joined_at = now() where id = v_part.id;
    return v_part.habit_id;
  end if;

  insert into habits (plan_id, name, amount, days, domain_id, group_challenge_id, sort_order)
  values (v_plan, v.habit_name, v.amount, v.days, v.domain_id, v.id,
          coalesce((select max(sort_order) + 1 from habits where plan_id = v_plan), 0))
  returning id into v_habit;
  insert into group_challenge_participants (challenge_id, user_id, habit_id) values (v.id, v_user, v_habit)
  on conflict (challenge_id, user_id) do update set habit_id = excluded.habit_id, withdrawn_at = null, joined_at = now();
  return v_habit;
end $$;

-- «انسحب من التحدّي»: archives the challenge habit; history stays.
create function withdraw_group_challenge(p_challenge uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_part group_challenge_participants;
begin
  select * into v_part from group_challenge_participants
  where challenge_id = p_challenge and user_id = auth.uid() and withdrawn_at is null;
  if v_part.id is null then raise exception 'not_found'; end if;
  update group_challenge_participants set withdrawn_at = now() where id = v_part.id;
  update habits set archived_at = coalesce(archived_at, now()) where id = v_part.habit_id;
end $$;

-- «التحدّي»: current and upcoming challenges for the caller, with their own progress and counts of
-- their group — never names or ranks (spec 007 FR-004; FR-083).
create function my_group_challenges() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_today date; v_group uuid;
begin
  if v_user is null then return '[]'::jsonb; end if;
  v_today := user_local_date(v_user);
  v_group := my_member_group();
  if v_group is null or not group_feature(v_group, 'challenges') then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', gc.id, 'title', gc.title, 'description', gc.description, 'habit_name', gc.habit_name,
      'amount', gc.amount, 'days', gc.days, 'starts_on', gc.starts_on, 'duration_days', gc.duration_days,
      'domain', (select name from life_domains where id = gc.domain_id),
      'status', case when v_today < gc.starts_on then 'upcoming' else 'active' end,
      'day', least(greatest(v_today - gc.starts_on + 1, 0), gc.duration_days),
      'joined', p.id is not null and p.withdrawn_at is null,
      'kept', coalesce((select count(*) from habit_completions hc
                        where hc.habit_id = p.habit_id and hc.local_date between gc.starts_on and v_today
                          and habit_on(gc.days, hc.local_date)), 0),
      'possible', greatest(scheduled_ord(gc.days, least(v_today, gc.starts_on + gc.duration_days - 1))
                           - scheduled_ord(gc.days, gc.starts_on - 1), 0),
      'group_joined', (select count(*) from group_challenge_participants gp
                       join group_memberships gm on gm.user_id = gp.user_id and gm.group_id = v_group
                                                 and gm.role = 'member' and gm.ended_on is null
                       where gp.challenge_id = gc.id and gp.withdrawn_at is null),
      'group_done_today', (select count(*) from group_challenge_participants gp
                           join group_memberships gm on gm.user_id = gp.user_id and gm.group_id = v_group
                                                     and gm.role = 'member' and gm.ended_on is null
                           join habit_completions hc on hc.habit_id = gp.habit_id
                                                    and hc.local_date = user_local_date(gp.user_id)
                           where gp.challenge_id = gc.id and gp.withdrawn_at is null))
      order by gc.starts_on)
    from group_challenges gc
    left join group_challenge_participants p on p.challenge_id = gc.id and p.user_id = v_user
    where can_see_group_challenge(gc.id) and v_today < gc.starts_on + gc.duration_days), '[]'::jsonb);
end $$;

-- ── «مجموعتي»: what peers chose to share (spec 007 FR-001/002) ─────────────
-- Only active MEMBERS of the caller's group see each other's shared habits (name and today's state);
-- facilitators are never peers here (constitution IV).
create function group_together() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_group uuid; v_sharing boolean;
begin
  v_group := my_member_group();
  if v_user is null or v_group is null then return null; end if;
  v_sharing := group_feature(v_group, 'sharing');
  return jsonb_build_object(
    'group', (select jsonb_build_object('id', g.id, 'name', g.name, 'cohort', c.name, 'start_date', c.start_date,
                                        'members', (select count(*) from group_memberships
                                                    where group_id = g.id and role = 'member' and ended_on is null))
              from groups g join cohorts c on c.id = g.cohort_id where g.id = v_group),
    'sharing', v_sharing,
    'items', case when not v_sharing then '[]'::jsonb else coalesce((
      with members as (
        select gm.user_id, u.full_name, user_local_date(gm.user_id) as today
        from group_memberships gm join users u on u.id = gm.user_id
        where gm.group_id = v_group and gm.role = 'member' and gm.ended_on is null
      ), shared as (
        select m.user_id, m.full_name, h.id as habit_id, h.name,
               coalesce(h.library_habit_id::text, lower(regexp_replace(btrim(h.name), '\s+', ' ', 'g'))) as match_key,
               exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.local_date = m.today) as done
        from members m
        join plans p on p.user_id = m.user_id and p.cohort_id = current_cohort_id(m.user_id)
        join habits h on h.plan_id = p.id
        where h.shared_with_group and not h.is_private and h.archived_at is null and habit_on(h.days, m.today)
      )
      select jsonb_agg(jsonb_build_object('user_id', s.user_id, 'name', s.full_name, 'me', s.user_id = v_user,
                                          'habit', s.name, 'done', s.done,
                                          'together', (select count(distinct x.user_id) from shared x where x.match_key = s.match_key))
                       order by s.user_id = v_user desc, s.full_name, s.name)
      from shared s), '[]'::jsonb) end);
end $$;

-- ── «المجتمع»: every upcoming activity the caller may see ──────────────────
create function community_activities() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'title', a.title, 'description', a.description, 'mode', a.mode, 'presenter', a.presenter,
      'location', case when a.mode = 'in_person' then a.location end,
      'next_starts_at', n.starts_at, 'next_ends_at', n.ends_at,
      'session_count', (select count(*) from activity_sessions s where s.activity_id = a.id),
      'registration_open', a.registration_open,
      'registered', exists (select 1 from activity_registrations r where r.activity_id = a.id and r.user_id = auth.uid() and r.cancelled_at is null),
      'places_left', case when a.capacity is null then null
                          else greatest(a.capacity - (select count(*) from activity_registrations r
                                                      where r.activity_id = a.id and r.cancelled_at is null), 0) end,
      'window_open', coalesce(activity_window_open(a.id), false),
      'is_new', a.created_at > now() - interval '7 days') order by n.starts_at)
    from activities a
    cross join lateral (select s.starts_at, s.ends_at from activity_sessions s
                        where s.activity_id = a.id and coalesce(s.ends_at, s.starts_at + interval '2 hours') > now()
                        order by s.starts_at limit 1) n
    where a.cancelled_at is null and (can_see_activity(a.id) or a.created_by = auth.uid())), '[]'::jsonb);
end $$;

revoke execute on function join_group_challenge(uuid), withdraw_group_challenge(uuid), my_group_challenges(),
  group_together(), community_activities() from public, anon;
grant execute on function join_group_challenge(uuid), withdraw_group_challenge(uuid), my_group_challenges(),
  group_together(), community_activities() to authenticated;

-- ── Closed groups take no new members ─────────────────────────────────────
create or replace function check_invitation(p_code text, out cohort_name text, out group_name text)
language plpgsql stable security definer set search_path = public as $$
declare v invitation_codes;
begin
  select * into v from invitation_codes where code = normalize_invitation_code(p_code);
  if not found or v.revoked_at is not null then raise exception 'code_invalid'; end if;
  if v.expires_at <= now() then raise exception 'code_expired'; end if;
  if v.uses >= v.max_uses then raise exception 'code_used_up'; end if;
  if exists (select 1 from groups where id = v.group_id and status = 'closed') then raise exception 'code_invalid'; end if;
  select c.name, g.name into cohort_name, group_name
  from cohorts c join groups g on g.cohort_id = c.id
  where c.id = v.cohort_id and g.id = v.group_id;
end $$;
create or replace function redeem_invitation(
  p_code text, p_auth_user uuid, p_full_name text, p_email text, p_time_zone text,
  p_phone text default null, p_gender gender default null, p_city text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v invitation_codes;
  v_today date;
begin
  select * into v from invitation_codes where code = normalize_invitation_code(p_code) for update;
  if not found or v.revoked_at is not null then raise exception 'code_invalid'; end if;
  if v.expires_at <= now() then raise exception 'code_expired'; end if;
  if v.uses >= v.max_uses then raise exception 'code_used_up'; end if;
  -- Spec 007: a closed group takes no new members.
  if exists (select 1 from groups where id = v.group_id and status = 'closed') then raise exception 'code_invalid'; end if;
  if not exists (select 1 from auth.users where id = p_auth_user) then
    raise exception 'not_found: auth user';
  end if;

  if not exists (select 1 from users where id = p_auth_user) then
    insert into users (id, full_name, email, phone, gender, city, time_zone, active_role)
    values (p_auth_user, btrim(p_full_name), lower(btrim(p_email)), nullif(p_phone, ''), p_gender,
            nullif(btrim(p_city), ''), coalesce(p_time_zone, 'Asia/Riyadh'), 'member');
    insert into user_roles (user_id, role) values (p_auth_user, 'member') on conflict do nothing;
  end if;

  select (now() at time zone time_zone)::date into v_today from users where id = p_auth_user;
  update group_memberships set ended_on = greatest(v_today - 1, started_on)
  where user_id = p_auth_user and role = 'member' and ended_on is null;
  insert into group_memberships (group_id, user_id, role, started_on)
  values (v.group_id, p_auth_user, 'member', v_today);
  insert into plans (user_id, cohort_id) values (p_auth_user, v.cohort_id) on conflict do nothing;

  update invitation_codes set uses = uses + 1 where id = v.id;
  return p_auth_user;
end $$;

-- ── Activities: presenter ─────────────────────────────────────────────────
drop function save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid, jsonb, boolean, int, activity_mode, text);
create function save_activity(
  p_id uuid default null, p_title text default null, p_description text default null,
  p_starts_at timestamptz default null, p_ends_at timestamptz default null,
  p_location text default null, p_group_ids uuid[] default null, p_cohort_id uuid default null,
  p_sessions jsonb default null, p_registration_open boolean default false, p_capacity int default null,
  p_mode activity_mode default 'in_person', p_meeting_url text default null, p_presenter text default null
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
    insert into activities (title, description, starts_at, ends_at, location, created_by, registration_open, capacity, mode, presenter)
    values (btrim(p_title), nullif(btrim(p_description), ''), v_first, v_last_end,
            nullif(btrim(p_location), ''), auth.uid(), coalesce(p_registration_open, false), p_capacity, coalesce(p_mode, 'in_person'),
            nullif(btrim(p_presenter), ''))
    returning id into v_id;
  else
    update activities
    set title = btrim(p_title), description = nullif(btrim(p_description), ''), location = nullif(btrim(p_location), ''),
        registration_open = coalesce(p_registration_open, false), capacity = p_capacity, mode = coalesce(p_mode, 'in_person'),
        presenter = nullif(btrim(p_presenter), '')
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

revoke execute on function save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid, jsonb, boolean, int, activity_mode, text, text) from public, anon;
grant execute on function save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid, jsonb, boolean, int, activity_mode, text, text) to authenticated;

-- ── «يومك»: shared/private flags and the challenge on a habit ─────────────
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
               'week', coalesce(d.week, '[]'::jsonb), 'current_streak', coalesce(d.current_streak, 0),
               'shared', h.shared_with_group, 'is_private', h.is_private,
               'challenge', (select jsonb_build_object('id', gc.id, 'title', gc.title,
                                                       'day', least(greatest(v_date - gc.starts_on + 1, 0), gc.duration_days),
                                                       'days', gc.duration_days)
                             from group_challenges gc where gc.id = h.group_challenge_id))
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
                                                            'shared_with_group', h.shared_with_group, 'is_private', h.is_private,
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
    'group_challenges', (select coalesce(jsonb_agg(jsonb_build_object('challenge', gc.title, 'joined_at', p.joined_at,
                                                                      'withdrawn_at', p.withdrawn_at)), '[]')
                         from group_challenge_participants p join group_challenges gc on gc.id = p.challenge_id
                         where p.user_id = (select id from me)),
    'encouragements_received', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                                from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                                where e.recipient_id = (select id from me)),
    'encouragements_sent', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                            from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                            where e.sender_id = (select id from me))
  );
$$;

