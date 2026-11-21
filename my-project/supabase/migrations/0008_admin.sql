-- 0008 Admin and facilitator management (US2). Admin write policies on structure, invitation,
-- and content tables were created with those tables (0003–0007); this migration adds:
--   * facilitator write rules for activities (own groups only; FR-044),
--   * save_activity / cancel_activity (one transaction, RLS applies),
--   * admin functions for memberships and roles, guarded by an explicit admin check.

-- ── Activities: facilitator rules ──────────────────────────────────────────
create function activity_created_by_me(p_activity uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from activities where id = p_activity and created_by = auth.uid());
end $$;

-- Every audience row of the activity is a group the caller leads (no cohort-wide rows).
create function activity_led_by_me(p_activity uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return not exists (
    select 1 from activity_audiences
    where activity_id = p_activity
      and (cohort_id is not null or not is_group_facilitator(group_id))
  );
end $$;

create policy activities_facilitator_insert on activities for insert to authenticated
  with check (created_by = auth.uid() and has_role('facilitator'));
create policy activities_facilitator_update on activities for update to authenticated
  using (created_by = auth.uid() and has_role('facilitator') and activity_led_by_me(id))
  with check (created_by = auth.uid());
create policy activity_audiences_facilitator_insert on activity_audiences for insert to authenticated
  with check (group_id is not null and is_group_facilitator(group_id) and activity_created_by_me(activity_id));
create policy activity_audiences_facilitator_delete on activity_audiences for delete to authenticated
  using (group_id is not null and is_group_facilitator(group_id) and activity_created_by_me(activity_id));
revoke delete on activities from authenticated; -- activities are cancelled, not deleted

-- Creates (p_id null) or edits an activity and replaces its audience: either groups or one cohort.
-- SECURITY INVOKER: the policies above decide what the caller may do.
-- All parameters have defaults so callers can omit the optional ones (title and start are
-- still required by the table's constraints).
create function save_activity(
  p_id uuid default null, p_title text default null, p_description text default null,
  p_starts_at timestamptz default null, p_ends_at timestamptz default null,
  p_location text default null, p_group_ids uuid[] default null, p_cohort_id uuid default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if (coalesce(array_length(p_group_ids, 1), 0) > 0) = (p_cohort_id is not null) then
    raise exception 'invalid_input: an activity has either groups or one cohort as its audience';
  end if;

  if p_id is null then
    insert into activities (title, description, starts_at, ends_at, location, created_by)
    values (btrim(p_title), nullif(btrim(p_description), ''), p_starts_at, p_ends_at,
            nullif(btrim(p_location), ''), auth.uid())
    returning id into v_id;
  else
    update activities
    set title = btrim(p_title), description = nullif(btrim(p_description), ''),
        starts_at = p_starts_at, ends_at = p_ends_at, location = nullif(btrim(p_location), '')
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
  return v_id;
end $$;

create function cancel_activity(p_id uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  update activities set cancelled_at = coalesce(cancelled_at, now()) where id = p_id returning id into v_id;
  if v_id is null then raise exception 'not_found'; end if;
end $$;

-- ── Admin functions (memberships and roles) ────────────────────────────────
create function require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
end $$;

-- Moves a member to another group of the same cohort. History is kept: the old membership
-- ends, a new one starts today (in the member's time zone). Personal data is untouched.
create function move_member(p_user uuid, p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_old group_memberships; v_old_cohort uuid; v_new_cohort uuid; v_today date;
begin
  perform require_admin();
  select gm.* into v_old from group_memberships gm
  where gm.user_id = p_user and gm.role = 'member' and gm.ended_on is null;
  if not found then raise exception 'not_found: no active membership'; end if;
  select cohort_id into v_old_cohort from groups where id = v_old.group_id;
  select cohort_id into v_new_cohort from groups where id = p_group;
  if v_new_cohort is null then raise exception 'not_found: group'; end if;
  if v_new_cohort <> v_old_cohort then raise exception 'invalid_input: group is in another cohort'; end if;
  if v_old.group_id = p_group then return; end if;

  v_today := user_local_date(p_user);
  update group_memberships set ended_on = greatest(v_today - 1, started_on) where id = v_old.id;
  insert into group_memberships (group_id, user_id, role, started_on) values (p_group, p_user, 'member', v_today);
end $$;

-- Adds an existing account (with no active member membership) to a group and its cohort's plan.
-- New people join with invitation codes instead.
create function add_member(p_user uuid, p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_cohort uuid;
begin
  perform require_admin();
  if not exists (select 1 from users where id = p_user) then raise exception 'not_found: user'; end if;
  if exists (select 1 from group_memberships where user_id = p_user and role = 'member' and ended_on is null) then
    raise exception 'conflict: already in a group';
  end if;
  select cohort_id into v_cohort from groups where id = p_group;
  if v_cohort is null then raise exception 'not_found: group'; end if;
  insert into group_memberships (group_id, user_id, role, started_on) values (p_group, p_user, 'member', user_local_date(p_user));
  insert into user_roles (user_id, role) values (p_user, 'member') on conflict do nothing;
  insert into plans (user_id, cohort_id) values (p_user, v_cohort) on conflict do nothing;
end $$;

create function assign_facilitator(p_user uuid, p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if not exists (select 1 from users where id = p_user) then raise exception 'not_found: user'; end if;
  if not exists (select 1 from groups where id = p_group) then raise exception 'not_found: group'; end if;
  insert into user_roles (user_id, role) values (p_user, 'facilitator') on conflict do nothing;
  if not exists (select 1 from group_memberships
                 where group_id = p_group and user_id = p_user and role = 'facilitator' and ended_on is null) then
    insert into group_memberships (group_id, user_id, role, started_on)
    values (p_group, p_user, 'facilitator', user_local_date(p_user));
  end if;
end $$;

-- Ends the facilitator membership now (access is lost immediately); drops the facilitator role
-- when the person leads no other group.
create function remove_facilitator(p_user uuid, p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  update group_memberships set ended_on = greatest(user_local_date(p_user), started_on)
  where group_id = p_group and user_id = p_user and role = 'facilitator' and ended_on is null;
  if not exists (select 1 from group_memberships where user_id = p_user and role = 'facilitator' and ended_on is null) then
    delete from user_roles where user_id = p_user and role = 'facilitator';
  end if;
end $$;

create function grant_admin(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if not exists (select 1 from users where id = p_user) then raise exception 'not_found: user'; end if;
  insert into user_roles (user_id, role) values (p_user, 'admin') on conflict do nothing;
end $$;

create function revoke_admin(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if exists (select 1 from user_roles where user_id = p_user and role = 'admin')
     and (select count(*) from user_roles where role = 'admin') <= 1 then
    raise exception 'forbidden: the program needs at least one admin';
  end if;
  delete from user_roles where user_id = p_user and role = 'admin';
end $$;

revoke execute on function
  save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid), cancel_activity(uuid),
  move_member(uuid, uuid), add_member(uuid, uuid), assign_facilitator(uuid, uuid),
  remove_facilitator(uuid, uuid), grant_admin(uuid), revoke_admin(uuid), require_admin(),
  activity_created_by_me(uuid), activity_led_by_me(uuid)
from public, anon;
grant execute on function
  save_activity(uuid, text, text, timestamptz, timestamptz, text, uuid[], uuid), cancel_activity(uuid),
  move_member(uuid, uuid), add_member(uuid, uuid), assign_facilitator(uuid, uuid),
  remove_facilitator(uuid, uuid), grant_admin(uuid), revoke_admin(uuid), require_admin(),
  activity_created_by_me(uuid), activity_led_by_me(uuid)
to authenticated;
