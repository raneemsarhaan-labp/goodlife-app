-- 0007 Activities (group sessions, events) and the «يومك» read model get_today().

create table activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at > starts_at),
  location text check (char_length(location) <= 300),
  created_by uuid references users (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activities_starts_at on activities (starts_at) where cancelled_at is null;

create table activity_audiences (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities (id) on delete cascade,
  cohort_id uuid references cohorts (id) on delete cascade,
  group_id uuid references groups (id) on delete cascade,
  check (num_nonnulls(cohort_id, group_id) = 1)
);
create index activity_audiences_activity on activity_audiences (activity_id);

create trigger activities_updated_at before update on activities for each row execute function set_updated_at();

-- Active member or facilitator of any group in the cohort.
create function is_active_in_cohort(p_cohort uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from group_memberships gm join groups g on g.id = gm.group_id
    where g.cohort_id = p_cohort and gm.user_id = auth.uid() and gm.ended_on is null
  );
end $$;

-- The caller is in the activity's audience.
create function can_see_activity(p_activity uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from activity_audiences aa
    where aa.activity_id = p_activity
      and ((aa.group_id is not null and is_group_member(aa.group_id))
        or (aa.cohort_id is not null and is_active_in_cohort(aa.cohort_id)))
  );
end $$;

alter table activities enable row level security;
alter table activity_audiences enable row level security;
revoke all on activities, activity_audiences from anon;

create policy activities_select on activities for select to authenticated
  using (is_admin() or created_by = auth.uid() or can_see_activity(id));
create policy activity_audiences_select on activity_audiences for select to authenticated
  using (is_admin() or can_see_activity(activity_id));
create policy activities_admin on activities for all to authenticated
  using (is_admin()) with check (is_admin());
create policy activity_audiences_admin on activity_audiences for all to authenticated
  using (is_admin()) with check (is_admin());
-- Facilitator write policies for their own groups: 0008 (US2).

-- ── «يومك» read model ──────────────────────────────────────────────────────
-- One round trip for the home screen (SC-003). SECURITY INVOKER: RLS applies to every read.
-- p_which: 'today' | 'yesterday' (late logging, FR-011).
create function get_today(p_which text default 'today') returns jsonb
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
    'habits', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', h.id, 'name', h.name,
               'done', exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.local_date = v_date))
             order by h.sort_order, h.created_at)
      from habits h where h.plan_id = v_plan and h.archived_at is null), '[]'::jsonb),
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
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'starts_at', a.starts_at,
                                          'ends_at', a.ends_at, 'location', a.location)
             order by a.starts_at)
      from activities a
      where a.cancelled_at is null
        and a.starts_at >= now() - interval '2 hours'
        and a.starts_at < now() + interval '7 days'), '[]'::jsonb)
  );
end $$;

revoke execute on function get_today(text) from public, anon;
grant execute on function get_today(text) to authenticated;
