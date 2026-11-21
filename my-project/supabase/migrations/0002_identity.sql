-- 0002 Identity: users (profile, 1:1 with auth.users) and user_roles (data-model.md).

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  email text not null unique,
  phone text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  gender gender,
  city text check (char_length(city) <= 80),
  time_zone text not null default 'Asia/Riyadh',
  notification_prefs jsonb not null default '{}'::jsonb,
  active_role app_role not null default 'member',
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid not null references users (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create trigger users_updated_at before update on users
  for each row execute function set_updated_at();

-- users.time_zone must be a valid IANA zone.
create function users_validate_time_zone() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.time_zone) then
    raise exception 'invalid time zone: %', new.time_zone using errcode = '23514';
  end if;
  return new;
end $$;
create trigger users_time_zone_valid before insert or update of time_zone on users
  for each row execute function users_validate_time_zone();

-- users.active_role must be one of the user's roles. Deferred so a profile and its first role
-- can be created in the same transaction.
create function users_check_active_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from user_roles where user_id = new.id and role = new.active_role) then
    raise exception 'active_role % is not held by user', new.active_role using errcode = '23514';
  end if;
  return null;
end $$;
create constraint trigger users_active_role_held after insert or update of active_role on users
  deferrable initially deferred for each row execute function users_check_active_role();

-- Revoking a role resets active_role if it was the revoked one.
create function user_roles_reset_active() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update users set active_role = 'member'
  where id = old.user_id and active_role = old.role and old.role <> 'member';
  return old;
end $$;
create trigger user_roles_after_delete after delete on user_roles
  for each row execute function user_roles_reset_active();

-- RLS
alter table users enable row level security;
alter table user_roles enable row level security;

create policy users_select_self on users for select to authenticated using (id = auth.uid());
create policy users_select_admin on users for select to authenticated using (is_admin());
create policy users_update_self on users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Column privileges: users may edit only these fields of their own row.
revoke all on users, user_roles from anon;
revoke insert, update, delete on users from authenticated;
grant update (full_name, phone, gender, city, time_zone, active_role, notification_prefs)
  on users to authenticated;

create policy user_roles_select_self on user_roles for select to authenticated
  using (user_id = auth.uid());
create policy user_roles_select_admin on user_roles for select to authenticated using (is_admin());
-- Role changes go through admin functions (0008); no direct write policies.
revoke insert, update, delete on user_roles from authenticated;
