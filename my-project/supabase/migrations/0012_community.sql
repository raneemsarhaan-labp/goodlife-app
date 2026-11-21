-- 0012 Community: preset encouragements only (no free text, no private messages; FR-040/040a).

create table encouragement_phrases (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(btrim(text)) between 2 and 80),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table encouragements (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users (id) on delete cascade,
  recipient_id uuid not null references users (id) on delete cascade,
  phrase_id uuid not null references encouragement_phrases (id) on delete restrict,
  local_date date not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  unique (sender_id, recipient_id, local_date)
);
create index encouragements_recipient on encouragements (recipient_id, created_at desc);

create trigger encouragement_phrases_updated_at before update on encouragement_phrases for each row execute function set_updated_at();

alter table encouragement_phrases enable row level security;
alter table encouragements enable row level security;
revoke all on encouragement_phrases, encouragements from anon;
create policy encouragement_phrases_select on encouragement_phrases for select to authenticated using (true);
create policy encouragement_phrases_admin on encouragement_phrases for all to authenticated using (is_admin()) with check (is_admin());
create policy encouragements_select on encouragements for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
revoke insert, update, delete on encouragements from authenticated; -- only via send_encouragement

-- Both users hold an active membership (member or facilitator) in the same group.
create function shares_active_group(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_memberships a join group_memberships b on b.group_id = a.group_id
    where a.user_id = p_a and b.user_id = p_b and a.ended_on is null and b.ended_on is null
  );
$$;
revoke execute on function shares_active_group(uuid, uuid) from public, anon, authenticated;

-- People in the caller's current groups (names and roles only; FR-040). Profiles stay
-- self-only elsewhere, so this is the single way to see fellow participants.
create function group_peers()
returns table (user_id uuid, full_name text, role membership_role, group_id uuid)
language sql stable security definer set search_path = public as $$
  select distinct on (u.id, gm.group_id) u.id, u.full_name, gm.role, gm.group_id
  from group_memberships mine
  join group_memberships gm on gm.group_id = mine.group_id and gm.ended_on is null
  join users u on u.id = gm.user_id
  where mine.user_id = auth.uid() and mine.ended_on is null and gm.user_id <> auth.uid()
  order by u.id, gm.group_id, gm.role desc;
$$;

create function send_encouragement(p_recipient uuid, p_phrase uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'forbidden'; end if;
  if p_recipient = v_user then raise exception 'invalid_input: cannot encourage oneself'; end if;
  if not shares_active_group(v_user, p_recipient) then raise exception 'forbidden: not in the same group'; end if;
  if not exists (select 1 from encouragement_phrases where id = p_phrase and active) then
    raise exception 'invalid_input: phrase';
  end if;
  insert into encouragements (sender_id, recipient_id, phrase_id, local_date)
  values (v_user, p_recipient, p_phrase, user_local_date(v_user));
exception when unique_violation then
  raise exception 'limit_reached: once per person per day';
end $$;

-- Encouragements the caller received, newest first, with sender name and phrase.
create function received_encouragements(p_limit int default 30)
returns table (id uuid, sender_name text, phrase text, local_date date, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.id, u.full_name, p.text, e.local_date, e.created_at
  from encouragements e join users u on u.id = e.sender_id join encouragement_phrases p on p.id = e.phrase_id
  where e.recipient_id = auth.uid()
  order by e.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

revoke execute on function group_peers(), send_encouragement(uuid, uuid), received_encouragements(int) from public, anon;
grant execute on function group_peers(), send_encouragement(uuid, uuid), received_encouragements(int) to authenticated;
