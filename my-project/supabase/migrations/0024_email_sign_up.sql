-- 0024 Sign up with email + mobile + password, confirmed by a 6-digit code sent to the email.
-- The login is created unconfirmed with the details in its metadata; once the code is verified the
-- member is registered (register_member, now with the email). One account per email and per mobile.

drop function register_member(uuid, text, text, text);
create function register_member(p_auth_user uuid, p_full_name text, p_phone text, p_time_zone text, p_email text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid;
  v_cohort uuid;
  v_today date;
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  if p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_input: phone'; end if;
  if exists (select 1 from users where phone = p_phone) then raise exception 'conflict: phone'; end if;
  if v_email is not null and exists (select 1 from users where email = v_email) then raise exception 'conflict: email'; end if;
  if not exists (select 1 from auth.users where id = p_auth_user) then raise exception 'not_found: auth user'; end if;
  v_group := default_signup_group();
  if v_group is null then raise exception 'not_found: group'; end if;
  select cohort_id into v_cohort from groups where id = v_group;

  insert into users (id, full_name, email, phone, time_zone, active_role)
  values (p_auth_user, btrim(p_full_name), v_email, p_phone, coalesce(p_time_zone, 'Asia/Riyadh'), 'member');
  insert into user_roles (user_id, role) values (p_auth_user, 'member') on conflict do nothing;
  select (now() at time zone time_zone)::date into v_today from users where id = p_auth_user;
  insert into group_memberships (group_id, user_id, role, started_on) values (v_group, p_auth_user, 'member', v_today);
  insert into plans (user_id, cohort_id) values (p_auth_user, v_cohort) on conflict do nothing;
  return p_auth_user;
end $$;
revoke execute on function register_member(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function register_member(uuid, text, text, text, text) to service_role;

-- Server-only: the login for an email, whether it is confirmed and whether it has a member profile.
create function auth_login_by_email(p_email text)
returns table (id uuid, confirmed boolean, has_profile boolean)
language sql stable security definer set search_path = public as $$
  select a.id, a.email_confirmed_at is not null, exists (select 1 from users u where u.id = a.id)
  from auth.users a where lower(a.email) = lower(btrim(p_email))
  limit 1
$$;
revoke execute on function auth_login_by_email(text) from public, anon, authenticated;
grant execute on function auth_login_by_email(text) to service_role;
