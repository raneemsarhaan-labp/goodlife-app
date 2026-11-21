-- 0006 Challenges: journey challenges (admin-written, one per journey day), own challenges
-- (member-written, private), and their completions (data-model.md; spec FR-013).

create type challenge_kind as enum ('journey', 'own');

create table journey_challenges (
  id uuid primary key default gen_random_uuid(),
  journey_day int not null unique check (journey_day between 1 and 365),
  text text not null check (char_length(btrim(text)) between 2 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table own_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete restrict,
  local_date date not null,
  text text not null check (char_length(btrim(text)) between 2 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort_id, local_date)
);

create table challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cohort_id uuid not null references cohorts (id) on delete restrict,
  local_date date not null,
  recorded_at timestamptz,
  kind challenge_kind not null,
  journey_challenge_id uuid references journey_challenges (id) on delete cascade,
  own_challenge_id uuid references own_challenges (id) on delete cascade,
  client_mutation_id uuid not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, cohort_id, local_date, kind),
  check ((kind = 'journey') = (journey_challenge_id is not null)),
  check ((kind = 'own') = (own_challenge_id is not null))
);

create trigger journey_challenges_updated_at before update on journey_challenges for each row execute function set_updated_at();
create trigger own_challenges_updated_at before update on own_challenges for each row execute function set_updated_at();
create trigger own_challenges_dates before insert or update on own_challenges
  for each row execute function enforce_journey_dates();
create trigger challenge_completions_dates before insert or update on challenge_completions
  for each row execute function enforce_journey_dates();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table journey_challenges enable row level security;
alter table own_challenges enable row level security;
alter table challenge_completions enable row level security;
revoke all on journey_challenges, own_challenges, challenge_completions from anon;

-- Journey challenges are revealed day by day: only up to the caller's journey day.
create policy journey_challenges_select on journey_challenges for select to authenticated
  using (is_admin() or journey_day <= coalesce(journey_day(auth.uid(), user_local_date(auth.uid())), 0));
create policy journey_challenges_admin on journey_challenges for all to authenticated
  using (is_admin()) with check (is_admin());

create policy own_challenges_select_self on own_challenges for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on own_challenges from authenticated;
create policy challenge_completions_select_self on challenge_completions for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on challenge_completions from authenticated;

-- ── Actions ────────────────────────────────────────────────────────────────
-- Write, edit, or (with empty text) remove today's own challenge.
create function set_own_challenge(p_text text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid()); v_today date; v_id uuid;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  v_today := user_local_date(v_user);
  perform assert_day_editable(v_user, v_cohort, v_today, null);
  if nullif(btrim(p_text), '') is null then
    delete from own_challenges where user_id = v_user and cohort_id = v_cohort and local_date = v_today;
    return null;
  end if;
  insert into own_challenges (user_id, cohort_id, local_date, text)
  values (v_user, v_cohort, v_today, btrim(p_text))
  on conflict (user_id, cohort_id, local_date) do update set text = excluded.text
  returning id into v_id;
  return v_id;
end $$;

create function set_challenge_done(
  p_kind challenge_kind, p_local_date date, p_done boolean, p_client_mutation_id uuid,
  p_recorded_at timestamptz default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_cohort uuid := current_cohort_id(auth.uid());
  v_start date; v_journey uuid; v_own uuid;
begin
  if v_user is null then raise exception 'forbidden'; end if;
  perform assert_day_editable(v_user, v_cohort, p_local_date, p_recorded_at);
  if p_kind = 'journey' then
    select start_date into v_start from cohorts where id = v_cohort;
    select id into v_journey from journey_challenges where journey_day = p_local_date - v_start + 1;
    if v_journey is null then raise exception 'not_found'; end if;
  else
    select id into v_own from own_challenges
    where user_id = v_user and cohort_id = v_cohort and local_date = p_local_date;
    if v_own is null then raise exception 'not_found'; end if;
  end if;

  if p_done then
    insert into challenge_completions (user_id, cohort_id, local_date, recorded_at, kind,
                                       journey_challenge_id, own_challenge_id, client_mutation_id)
    values (v_user, v_cohort, p_local_date, p_recorded_at, p_kind, v_journey, v_own, p_client_mutation_id)
    on conflict do nothing;
  else
    delete from challenge_completions
    where user_id = v_user and cohort_id = v_cohort and local_date = p_local_date and kind = p_kind;
  end if;
end $$;

revoke execute on function set_own_challenge(text), set_challenge_done(challenge_kind, date, boolean, uuid, timestamptz) from public, anon;
grant execute on function set_own_challenge(text), set_challenge_done(challenge_kind, date, boolean, uuid, timestamptz) to authenticated;
