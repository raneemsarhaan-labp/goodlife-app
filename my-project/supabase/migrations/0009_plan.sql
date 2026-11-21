-- 0009 «خطتي»: focus areas, habit ↔ area links, reordering, copy habits from the previous journey.

create table focus_areas (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (char_length(description) <= 500),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index focus_areas_plan on focus_areas (plan_id);
create trigger focus_areas_updated_at before update on focus_areas for each row execute function set_updated_at();

alter table habits add column focus_area_id uuid references focus_areas (id) on delete set null;

-- A habit may only link to a focus area of its own plan.
create function habits_check_focus_area() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.focus_area_id is not null and not exists (
    select 1 from focus_areas where id = new.focus_area_id and plan_id = new.plan_id
  ) then
    raise exception 'focus area belongs to another plan' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger habits_focus_area_same_plan before insert or update of focus_area_id, plan_id on habits
  for each row execute function habits_check_focus_area();

-- Editing a plan's text is limited to the current journey (data-model.md journey scoping).
drop policy plans_update_self on plans;
create policy plans_update_current on plans for update to authenticated
  using (id = current_plan_id()) with check (id = current_plan_id());

-- Every change to habits or areas marks the plan as updated (FR-024 "last updated").
create function touch_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update plans set updated_at = now() where id = coalesce(new.plan_id, old.plan_id);
  return coalesce(new, old);
end $$;
create trigger focus_areas_touch_plan after insert or update or delete on focus_areas
  for each row execute function touch_plan();
create trigger habits_touch_plan after insert or update on habits
  for each row execute function touch_plan();

alter table focus_areas enable row level security;
revoke all on focus_areas from anon;
create policy focus_areas_select_owner on focus_areas for select to authenticated
  using (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy focus_areas_write_current on focus_areas for all to authenticated
  using (plan_id = current_plan_id()) with check (plan_id = current_plan_id());

-- Reorder by giving each id its position. SECURITY INVOKER: RLS limits it to the caller's rows.
create function reorder_habits(p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update habits h set sort_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where h.id = o.id;
$$;
create function reorder_focus_areas(p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update focus_areas f set sort_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where f.id = o.id;
$$;

-- New journey: copy name, description, and order of the previous plan's active habits
-- (optionally only some) into the current plan. Returns how many were copied.
create function copy_habits_from_previous_plan(p_habit_ids uuid[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_current uuid := current_plan_id(); v_previous uuid; v_count int;
begin
  if v_current is null then raise exception 'not_found: no current plan'; end if;
  select p.id into v_previous
  from plans p join cohorts c on c.id = p.cohort_id
  where p.user_id = auth.uid() and p.id <> v_current
  order by c.start_date desc limit 1;
  if v_previous is null then return 0; end if;
  insert into habits (plan_id, name, description, sort_order)
  select v_current, h.name, h.description,
         coalesce((select max(sort_order) from habits where plan_id = v_current), 0) + row_number() over (order by h.sort_order)
  from habits h
  where h.plan_id = v_previous and h.archived_at is null
    and (p_habit_ids is null or h.id = any (p_habit_ids))
    and not exists (select 1 from habits x where x.plan_id = v_current and x.name = h.name and x.archived_at is null);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Active habits of the caller's previous journey (for the «خطتي» offer card).
create function previous_plan_habit_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from habits h
  where h.archived_at is null and h.plan_id = (
    select p.id from plans p join cohorts c on c.id = p.cohort_id
    where p.user_id = auth.uid() and p.id is distinct from current_plan_id()
    order by c.start_date desc limit 1);
$$;

revoke execute on function reorder_habits(uuid[]), reorder_focus_areas(uuid[]), copy_habits_from_previous_plan(uuid[]), previous_plan_habit_count() from public, anon;
grant execute on function reorder_habits(uuid[]), reorder_focus_areas(uuid[]), copy_habits_from_previous_plan(uuid[]), previous_plan_habit_count() to authenticated;
