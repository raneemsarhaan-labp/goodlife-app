-- 0022 Sign up with mobile + password (no email, no invitation code).
-- A new member gives their name, mobile and a password, and joins the default group: the group
-- marked is_default, or else the first open group of the most recent cohort. One account per mobile.

alter table users alter column email drop not null;
create unique index users_phone_unique on users (phone) where phone is not null;

alter table groups add column is_default boolean not null default false;
create unique index groups_one_default on groups (is_default) where is_default;

-- The group new sign-ups join; null when there is no open group.
create function default_signup_group() returns uuid
language sql stable security definer set search_path = public as $$
  select g.id
  from groups g join cohorts c on c.id = g.cohort_id
  where g.status = 'open'
  order by g.is_default desc, c.start_date desc, g.created_at, g.id
  limit 1
$$;
revoke execute on function default_signup_group() from public, anon, authenticated;
grant execute on function default_signup_group() to service_role;

-- Server-only (service role): creates the profile, member role, membership in the default group and
-- an empty plan for an auth user just created for this mobile. Atomic.
create function register_member(p_auth_user uuid, p_full_name text, p_phone text, p_time_zone text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid;
  v_cohort uuid;
  v_today date;
begin
  if p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_input: phone'; end if;
  if exists (select 1 from users where phone = p_phone) then raise exception 'conflict: phone'; end if;
  if not exists (select 1 from auth.users where id = p_auth_user) then raise exception 'not_found: auth user'; end if;
  v_group := default_signup_group();
  if v_group is null then raise exception 'not_found: group'; end if;
  select cohort_id into v_cohort from groups where id = v_group;

  insert into users (id, full_name, phone, time_zone, active_role)
  values (p_auth_user, btrim(p_full_name), p_phone, coalesce(p_time_zone, 'Asia/Riyadh'), 'member');
  insert into user_roles (user_id, role) values (p_auth_user, 'member') on conflict do nothing;
  select (now() at time zone time_zone)::date into v_today from users where id = p_auth_user;
  insert into group_memberships (group_id, user_id, role, started_on) values (v_group, p_auth_user, 'member', v_today);
  insert into plans (user_id, cohort_id) values (p_auth_user, v_cohort) on conflict do nothing;
  return p_auth_user;
end $$;
revoke execute on function register_member(uuid, text, text, text) from public, anon, authenticated;
grant execute on function register_member(uuid, text, text, text) to service_role;

-- Admin: choose which group new sign-ups join.
create function set_default_group(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not has_role('admin') then raise exception 'forbidden'; end if;
  if not exists (select 1 from groups where id = p_group) then raise exception 'not_found: group'; end if;
  update groups set is_default = false where is_default and id <> p_group;
  update groups set is_default = true where id = p_group;
end $$;
revoke execute on function set_default_group(uuid) from public, anon;
grant execute on function set_default_group(uuid) to authenticated;
