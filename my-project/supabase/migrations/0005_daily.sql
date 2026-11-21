-- 0005 Daily practice: plans, habits, habit_completions, day_entries, closing_messages,
-- and the journey scoping / date rules (data-model.md "Journey scoping and date rules").

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete restrict,
  current_state text not null default '' check (char_length(current_state) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort_id)
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (char_length(description) <= 500),
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index habits_plan on habits (plan_id) where archived_at is null;

create table habit_completions (
  habit_id uuid not null references habits (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  local_date date not null,
  recorded_at timestamptz,
  client_mutation_id uuid not null unique,
  created_at timestamptz not null default now(),
  primary key (habit_id, local_date)
);
create index habit_completions_user_date on habit_completions (user_id, local_date);

create table closing_messages (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(btrim(text)) between 2 and 200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete restrict,
  local_date date not null,
  intention text check (char_length(intention) <= 300),
  reflection text check (char_length(reflection) <= 1000),
  closed_at timestamptz,
  closing_message_id uuid references closing_messages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort_id, local_date)
);

create trigger plans_updated_at before update on plans for each row execute function set_updated_at();
create trigger habits_updated_at before update on habits for each row execute function set_updated_at();
create trigger closing_messages_updated_at before update on closing_messages for each row execute function set_updated_at();
create trigger day_entries_updated_at before update on day_entries for each row execute function set_updated_at();

-- ── Journey scoping and date rules ─────────────────────────────────────────
-- Raises 'date_not_editable' unless p_date may be written for p_user in p_cohort:
--   * p_cohort is the user's current cohort, and p_date is inside its journey window;
--   * online (p_recorded_at null): p_date is today or yesterday in the user's time zone;
--   * offline replay: p_date is the tap day or the day before, the tap is not in the future,
--     and it arrives within 7 days of the tap.
-- `set_config('goodlife.seeding', 'on', true)` disables the check (seed data only).
create function assert_day_editable(p_user uuid, p_cohort uuid, p_date date, p_recorded_at timestamptz)
returns void language plpgsql stable security definer set search_path = public as $$
declare v_tz text; v_today date; v_start date; v_end date; v_tap date;
begin
  if current_setting('goodlife.seeding', true) = 'on' then return; end if;
  if p_cohort is null or p_cohort is distinct from current_cohort_id(p_user) then
    raise exception 'date_not_editable: not the current journey';
  end if;
  select start_date, end_date into v_start, v_end from cohorts where id = p_cohort;
  if p_date < v_start or p_date > v_end then
    raise exception 'date_not_editable: outside the journey';
  end if;
  select time_zone into v_tz from users where id = p_user;
  v_today := (now() at time zone v_tz)::date;
  if p_recorded_at is null then
    if p_date not in (v_today, v_today - 1) then
      raise exception 'date_not_editable: only today or yesterday';
    end if;
  else
    if p_recorded_at > now() + interval '5 minutes' or now() - p_recorded_at > interval '7 days' then
      raise exception 'date_not_editable: tap too old or in the future';
    end if;
    v_tap := (p_recorded_at at time zone v_tz)::date;
    if p_date not in (v_tap, v_tap - 1) then
      raise exception 'date_not_editable: date does not match the tap';
    end if;
  end if;
end $$;
revoke execute on function assert_day_editable(uuid, uuid, date, timestamptz) from public, anon;

-- Defense in depth: the same rule on every insert/update of day-level rows.
create function enforce_journey_dates() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb := to_jsonb(new); v_cohort uuid;
begin
  if tg_table_name = 'habit_completions' then
    select p.cohort_id into v_cohort from habits h join plans p on p.id = h.plan_id where h.id = new.habit_id;
  else
    v_cohort := (r ->> 'cohort_id')::uuid;
  end if;
  perform assert_day_editable((r ->> 'user_id')::uuid, v_cohort, (r ->> 'local_date')::date,
                              (r ->> 'recorded_at')::timestamptz);
  return new;
end $$;

create trigger habit_completions_dates before insert or update on habit_completions
  for each row execute function enforce_journey_dates();
create trigger day_entries_dates before insert or update on day_entries
  for each row execute function enforce_journey_dates();

-- The caller's plan for their current cohort.
create function current_plan_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from plans where user_id = auth.uid() and cohort_id = current_cohort_id(auth.uid())
$$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table plans enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table closing_messages enable row level security;
alter table day_entries enable row level security;
revoke all on plans, habits, habit_completions, closing_messages, day_entries from anon;

-- plans: self only (no facilitator or admin access to personal content; constitution IV).
create policy plans_select_self on plans for select to authenticated using (user_id = auth.uid());
create policy plans_update_self on plans for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on plans from authenticated;
grant update (current_state) on plans to authenticated;

-- habits: owner of the plan; writes only to the current journey's plan.
create policy habits_select_owner on habits for select to authenticated
  using (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy habits_insert_current on habits for insert to authenticated
  with check (plan_id = current_plan_id());
create policy habits_update_current on habits for update to authenticated
  using (plan_id = current_plan_id()) with check (plan_id = current_plan_id());
revoke delete on habits from authenticated; -- habits are archived, not deleted (FR-022)

-- completions and day entries: read own; write only through the functions below.
create policy habit_completions_select_self on habit_completions for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on habit_completions from authenticated;
create policy day_entries_select_self on day_entries for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on day_entries from authenticated;

create policy closing_messages_select on closing_messages for select to authenticated using (true);
create policy closing_messages_admin on closing_messages for all to authenticated
  using (is_admin()) with check (is_admin());

-- ── Daily actions (contracts/server-actions.md › Today) ───────────────────
create function set_habit_done(
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
                   where h.plan_id = v_plan and h.archived_at is null and hc.local_date = p_local_date),
    'total', (select count(*) from habits where plan_id = v_plan and archived_at is null)
  );
end $$;

create function set_intention(p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v_today date;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  v_today := user_local_date(v_user);
  perform assert_day_editable(v_user, v_cohort, v_today, null);
  insert into day_entries (user_id, cohort_id, local_date, intention)
  values (v_user, v_cohort, v_today, nullif(btrim(p_text), ''))
  on conflict (user_id, cohort_id, local_date) do update set intention = excluded.intention;
end $$;

-- «ختام اليوم»: records the day as closed with an optional reflection; returns a closing message.
create function close_day(p_reflection text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v_today date;
  v_msg closing_messages;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  v_today := user_local_date(v_user);
  perform assert_day_editable(v_user, v_cohort, v_today, null);
  select * into v_msg from closing_messages where active order by random() limit 1;
  insert into day_entries (user_id, cohort_id, local_date, reflection, closed_at, closing_message_id)
  values (v_user, v_cohort, v_today, nullif(btrim(p_reflection), ''), now(), v_msg.id)
  on conflict (user_id, cohort_id, local_date) do update
    set reflection = excluded.reflection, closed_at = excluded.closed_at,
        closing_message_id = excluded.closing_message_id;
  return jsonb_build_object('closing_message', v_msg.text, 'closed_at', now());
end $$;

revoke execute on function set_habit_done(uuid, date, boolean, uuid, timestamptz), set_intention(text), close_day(text), current_plan_id() from public, anon;
grant execute on function set_habit_done(uuid, date, boolean, uuid, timestamptz), set_intention(text), close_day(text), current_plan_id() to authenticated;
