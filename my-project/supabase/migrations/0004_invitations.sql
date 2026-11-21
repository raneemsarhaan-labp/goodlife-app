-- 0004 Invitations: invitation_codes, check_invitation(), redeem_invitation() (data-model.md).

-- Composite key so an invitation's group is guaranteed to belong to its cohort.
alter table groups add constraint groups_id_cohort_unique unique (id, cohort_id);

create table invitation_codes (
  id uuid primary key default gen_random_uuid(),
  -- 8 characters from an unambiguous alphabet (no 0/O, 1/I/L).
  code text not null unique check (code ~ '^[A-HJKMNP-Z2-9]{8}$'),
  cohort_id uuid not null references cohorts (id) on delete restrict,
  group_id uuid not null,
  expires_at timestamptz not null,
  max_uses int not null default 1 check (max_uses >= 1),
  uses int not null default 0 check (uses >= 0 and uses <= max_uses),
  revoked_at timestamptz,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (group_id, cohort_id) references groups (id, cohort_id) on delete restrict
);

alter table invitation_codes enable row level security;
create policy invitation_codes_admin on invitation_codes for all to authenticated
  using (is_admin()) with check (is_admin());
revoke all on invitation_codes from anon;

create function normalize_invitation_code(p_code text) returns text
language sql immutable as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Callable before sign-in: validates a code and returns where it leads.
create function check_invitation(p_code text, out cohort_name text, out group_name text)
language plpgsql stable security definer set search_path = public as $$
declare v invitation_codes;
begin
  select * into v from invitation_codes where code = normalize_invitation_code(p_code);
  if not found or v.revoked_at is not null then raise exception 'code_invalid'; end if;
  if v.expires_at <= now() then raise exception 'code_expired'; end if;
  if v.uses >= v.max_uses then raise exception 'code_used_up'; end if;
  select c.name, g.name into cohort_name, group_name
  from cohorts c join groups g on g.cohort_id = c.id
  where c.id = v.cohort_id and g.id = v.group_id;
end $$;
grant execute on function check_invitation(text) to anon, authenticated;

-- Server-only (service role): redeems a code for an existing auth user. Creates the profile,
-- member role, active membership, and an empty plan for the cohort, atomically.
-- For a returning user (profile exists) the old member membership is ended: a new journey.
create function redeem_invitation(
  p_code text, p_auth_user uuid, p_full_name text, p_email text, p_time_zone text,
  p_phone text default null, p_gender gender default null, p_city text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v invitation_codes;
  v_today date;
begin
  select * into v from invitation_codes where code = normalize_invitation_code(p_code) for update;
  if not found or v.revoked_at is not null then raise exception 'code_invalid'; end if;
  if v.expires_at <= now() then raise exception 'code_expired'; end if;
  if v.uses >= v.max_uses then raise exception 'code_used_up'; end if;
  if not exists (select 1 from auth.users where id = p_auth_user) then
    raise exception 'not_found: auth user';
  end if;

  if not exists (select 1 from users where id = p_auth_user) then
    insert into users (id, full_name, email, phone, gender, city, time_zone, active_role)
    values (p_auth_user, btrim(p_full_name), lower(btrim(p_email)), nullif(p_phone, ''), p_gender,
            nullif(btrim(p_city), ''), coalesce(p_time_zone, 'Asia/Riyadh'), 'member');
    insert into user_roles (user_id, role) values (p_auth_user, 'member') on conflict do nothing;
  end if;

  select (now() at time zone time_zone)::date into v_today from users where id = p_auth_user;
  update group_memberships set ended_on = greatest(v_today - 1, started_on)
  where user_id = p_auth_user and role = 'member' and ended_on is null;
  insert into group_memberships (group_id, user_id, role, started_on)
  values (v.group_id, p_auth_user, 'member', v_today);
  insert into plans (user_id, cohort_id) values (p_auth_user, v.cohort_id) on conflict do nothing;

  update invitation_codes set uses = uses + 1 where id = v.id;
  return p_auth_user;
end $$;
revoke execute on function redeem_invitation(text, uuid, text, text, text, text, gender, text) from public, anon, authenticated;
grant execute on function redeem_invitation(text, uuid, text, text, text, text, gender, text) to service_role;
