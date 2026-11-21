-- 0015 Selectable visual versions (spec 002): appearance preferences, habit icons, daily quotes,
-- and the opening ritual (data-model.md). Forward-only (constitution v1.2.0).

create type ui_version as enum ('journey', 'glass', 'full_glass');

alter table users
  add column ui_version ui_version not null default 'journey',
  add column ui_ritual boolean not null default true,
  add column ui_reduce_transparency boolean not null default false,
  add column ui_chosen_at timestamptz;
grant update (ui_version, ui_ritual, ui_reduce_transparency, ui_chosen_at) on users to authenticated;

-- Curated habit icons (Material Symbols Rounded names; src/ui/icons.ts keeps the same list).
alter table habits add column icon text check (icon is null or icon in ('wb_sunny', 'menu_book', 'auto_stories', 'bedtime', 'nightlight', 'family_restroom', 'self_improvement', 'directions_walk', 'fitness_center', 'water_drop', 'restaurant', 'no_food', 'block', 'favorite', 'volunteer_activism', 'psychology', 'spa', 'edit_note', 'school', 'work', 'phone_disabled', 'mosque', 'eco', 'schedule'));

create table quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(btrim(text)) between 10 and 400),
  source text check (char_length(source) <= 120),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quotes_updated_at before update on quotes for each row execute function set_updated_at();

create table ritual_seen (
  user_id uuid not null references users (id) on delete cascade,
  local_date date not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

alter table quotes enable row level security;
alter table ritual_seen enable row level security;
revoke all on quotes, ritual_seen from anon;
create policy quotes_select on quotes for select to authenticated using (active or is_admin());
create policy quotes_admin on quotes for all to authenticated using (is_admin()) with check (is_admin());
create policy ritual_seen_select_self on ritual_seen for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on ritual_seen from authenticated;

-- The quote for a date: the n-th active quote by (sort_order, id), n = days since 2026-01-01
-- modulo the count — the same for everyone, no scheduled job (research §8).
create function quote_for_date(p_date date) returns quotes
language sql stable security definer set search_path = public as $$
  with q as (select *, row_number() over (order by sort_order, id) - 1 as i, count(*) over () as n
             from quotes where active)
  select id, text, source, sort_order, active, created_at, updated_at
  from q where i = ((p_date - date '2026-01-01') % n + n) % n;
$$;

-- Whether to show the opening quote card today, and which quote (FR-030–FR-032).
create function today_ritual() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v users; v_today date; v_q quotes;
begin
  select * into v from users where id = auth.uid();
  if v.id is null then return jsonb_build_object('show', false); end if;
  v_today := (now() at time zone v.time_zone)::date;
  v_q := quote_for_date(v_today);
  return jsonb_build_object(
    'show', v.ui_ritual and v.ui_version in ('journey', 'full_glass') and v_q.id is not null
            and not exists (select 1 from ritual_seen where user_id = v.id and local_date = v_today),
    'quote', case when v_q.id is null then null else jsonb_build_object('text', v_q.text, 'source', v_q.source) end
  );
end $$;

create function mark_ritual_seen() returns void
language sql security definer set search_path = public as $$
  insert into ritual_seen (user_id, local_date) select auth.uid(), user_local_date(auth.uid())
  where auth.uid() is not null on conflict do nothing;
$$;

revoke execute on function quote_for_date(date), today_ritual(), mark_ritual_seen() from public, anon;
grant execute on function quote_for_date(date), today_ritual(), mark_ritual_seen() to authenticated;


-- Per-habit details for the expandable habit row (FR-021): done days in the 7 days ending on
-- p_date, and the current streak. Caller's own current-journey habits only.
create function my_habit_details(p_date date)
returns table (habit_id uuid, week_done int, current_streak int)
language sql stable security definer set search_path = public as $$
  select h.id,
         (select count(*)::int from habit_completions hc where hc.habit_id = h.id and hc.local_date between p_date - 6 and p_date),
         coalesce(s.current_streak, 0)
  from habits h join plans p on p.id = h.plan_id
  left join habit_streaks(auth.uid(), p.cohort_id) s on s.habit_id = h.id
  where p.user_id = auth.uid() and p.cohort_id = current_cohort_id(auth.uid());
$$;
revoke execute on function my_habit_details(date) from public, anon;
grant execute on function my_habit_details(date) to authenticated;

-- «يومك» read model, extended with habit icon, description, week_done, current_streak (spec 002).
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
