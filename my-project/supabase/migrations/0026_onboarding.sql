-- 0026 «رحلة البداية»: a short setup after sign-up (current state → desired state → domains → first
-- habits → look) and a «خطوات البداية» checklist on «يومك» until the first day is lived.

alter table users
  add column setup_completed_at timestamptz,  -- the setup steps were finished or skipped
  add column onboarding_dismissed_at timestamptz; -- the checklist card was closed
-- Members who were already here skip the setup.
update users set setup_completed_at = now();

-- Marks the setup as done (finished or skipped).
create function finish_setup() returns void
language sql security definer set search_path = public as $$
  update users set setup_completed_at = coalesce(setup_completed_at, now()) where id = auth.uid()
$$;
revoke execute on function finish_setup() from public, anon;
grant execute on function finish_setup() to authenticated;

-- Hides the checklist card.
create function dismiss_onboarding() returns void
language sql security definer set search_path = public as $$
  update users set onboarding_dismissed_at = coalesce(onboarding_dismissed_at, now()) where id = auth.uid()
$$;
revoke execute on function dismiss_onboarding() from public, anon;
grant execute on function dismiss_onboarding() to authenticated;

-- Where the signed-in member is in «خطوات البداية» (each step true once done).
create function onboarding_status() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select * from users where id = auth.uid()),
       p as (select * from plans where id = current_plan_id())
  select jsonb_build_object(
    'setup_completed', (select setup_completed_at is not null from me),
    'dismissed', (select onboarding_dismissed_at is not null from me),
    'look', (select ui_chosen_at is not null from me),
    'current_state', coalesce((select btrim(current_state) <> '' from p), false),
    'desired_state', coalesce((select btrim(desired_state) <> '' from p), false),
    'domains', exists (select 1 from focus_areas f join p on f.plan_id = p.id where f.domain_id is not null),
    'habit', exists (select 1 from habits h join p on h.plan_id = p.id where h.archived_at is null),
    'intention', exists (select 1 from day_entries d where d.user_id = auth.uid() and coalesce(btrim(d.intention), '') <> ''),
    'closed_day', exists (select 1 from day_entries d where d.user_id = auth.uid() and d.closed_at is not null)
  )
$$;
revoke execute on function onboarding_status() from public, anon;
grant execute on function onboarding_status() to authenticated;

-- Setup step «أول عاداتك»: adds the chosen library habits to the current plan (daily, any time),
-- each under its domain's focus area when the plan has one. Skips ones already in the plan.
create function add_library_habits(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_plan uuid := current_plan_id();
  v_next int;
  v_added int;
begin
  if v_plan is null then raise exception 'forbidden: no current plan'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 12 then raise exception 'invalid_input: too many'; end if;
  select coalesce(max(sort_order), 0) into v_next from habits where plan_id = v_plan;
  with picked as (
    select l.*, row_number() over (order by d.sort_order, l.sort_order, l.id) as n
    from habit_library l join life_domains d on d.id = l.domain_id
    where l.id = any (p_ids) and l.active
      and not exists (select 1 from habits h where h.plan_id = v_plan and h.library_habit_id = l.id and h.archived_at is null)
  )
  insert into habits (plan_id, name, description, icon, domain_id, library_habit_id, amount, focus_area_id, sort_order)
  select v_plan, p.name, p.hint, p.icon, p.domain_id, p.id, p.amount,
         (select f.id from focus_areas f where f.plan_id = v_plan and f.domain_id = p.domain_id limit 1),
         v_next + p.n
  from picked p;
  get diagnostics v_added = row_count;
  return v_added;
end $$;
revoke execute on function add_library_habits(uuid[]) from public, anon;
grant execute on function add_library_habits(uuid[]) to authenticated;
