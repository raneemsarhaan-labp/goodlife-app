-- 0001 Foundation: enums, updated_at trigger, permission helpers (data-model.md).
-- Forward-only migration (constitution v1.2.0): never edit after merge; fix with a new migration.

create type app_role as enum ('member', 'facilitator', 'admin');
create type membership_role as enum ('member', 'facilitator');
create type gender as enum ('male', 'female');

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Permission helpers. SECURITY DEFINER so they can read role/membership tables regardless of
-- the caller's RLS; each answers only about the calling user (auth.uid()).
-- plpgsql bodies resolve tables at call time, so they can precede the tables they use.

create function has_role(p_role app_role) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from user_roles where user_id = auth.uid() and role = p_role);
end $$;

create function is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin');
end $$;

-- Active membership (any role) of the caller in the group.
create function is_group_member(p_group uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from group_memberships
    where group_id = p_group and user_id = auth.uid() and ended_on is null
  );
end $$;

-- Active facilitator membership of the caller in the group.
create function is_group_facilitator(p_group uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from group_memberships
    where group_id = p_group and user_id = auth.uid() and role = 'facilitator' and ended_on is null
  );
end $$;

-- Any membership (current or past, any role) of the caller in a group of the cohort.
create function is_in_cohort(p_cohort uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from group_memberships gm join groups g on g.id = gm.group_id
    where g.cohort_id = p_cohort and gm.user_id = auth.uid()
  );
end $$;

-- Today's date in the user's own time zone.
create function user_local_date(p_user uuid) returns date
language plpgsql stable security definer set search_path = public as $$
declare v_tz text;
begin
  select time_zone into v_tz from users where id = p_user;
  return (now() at time zone coalesce(v_tz, 'UTC'))::date;
end $$;

-- Cohort of the user's active member membership ("current cohort").
create function current_cohort_id(p_user uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v_cohort uuid;
begin
  select g.cohort_id into v_cohort
  from group_memberships gm join groups g on g.id = gm.group_id
  where gm.user_id = p_user and gm.role = 'member' and gm.ended_on is null;
  return v_cohort;
end $$;

revoke execute on function user_local_date(uuid), current_cohort_id(uuid) from anon;
