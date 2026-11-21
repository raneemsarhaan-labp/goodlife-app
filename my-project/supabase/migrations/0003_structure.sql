-- 0003 Program structure: cohorts, groups, group_memberships, journey_stages (data-model.md).

create table cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 2 and 80),
  start_date date not null,
  end_date date generated always as (start_date + 364) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, name)
);

create table group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete restrict,
  user_id uuid not null references users (id) on delete cascade,
  role membership_role not null,
  started_on date not null default current_date,
  ended_on date check (ended_on is null or ended_on >= started_on),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One active member membership per user; no duplicate active role in the same group.
create unique index group_memberships_one_active_member
  on group_memberships (user_id) where role = 'member' and ended_on is null;
create unique index group_memberships_unique_active_role
  on group_memberships (group_id, user_id, role) where ended_on is null;
create index group_memberships_group on group_memberships (group_id) where ended_on is null;

create table journey_stages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 80),
  description text check (char_length(description) <= 1000),
  from_day int not null check (from_day between 1 and 365),
  to_day int not null check (to_day between 1 and 365),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (to_day >= from_day),
  exclude using gist (int4range(from_day, to_day, '[]') with &&)
);

create trigger cohorts_updated_at before update on cohorts for each row execute function set_updated_at();
create trigger groups_updated_at before update on groups for each row execute function set_updated_at();
create trigger group_memberships_updated_at before update on group_memberships for each row execute function set_updated_at();
create trigger journey_stages_updated_at before update on journey_stages for each row execute function set_updated_at();

-- Journey day for a user on a local date: local_date - cohort.start_date + 1, capped 1..365.
create function journey_day(p_user uuid, p_local_date date) returns int
language plpgsql stable security definer set search_path = public as $$
declare v_start date;
begin
  select c.start_date into v_start from cohorts c where c.id = current_cohort_id(p_user);
  if v_start is null then return null; end if;
  return least(greatest(p_local_date - v_start + 1, 1), 365);
end $$;

-- RLS
alter table cohorts enable row level security;
alter table groups enable row level security;
alter table group_memberships enable row level security;
alter table journey_stages enable row level security;

create policy cohorts_select on cohorts for select to authenticated
  using (is_admin() or is_in_cohort(id));
create policy groups_select on groups for select to authenticated
  using (is_admin() or is_group_member(id));
create policy memberships_select on group_memberships for select to authenticated
  using (user_id = auth.uid() or is_group_facilitator(group_id) or is_admin());
create policy journey_stages_select on journey_stages for select to authenticated using (true);

-- Admin writes (structure and content are admin-managed; data-model.md).
create policy cohorts_admin_write on cohorts for all to authenticated
  using (is_admin()) with check (is_admin());
create policy groups_admin_write on groups for all to authenticated
  using (is_admin()) with check (is_admin());
create policy memberships_admin_write on group_memberships for all to authenticated
  using (is_admin()) with check (is_admin());
create policy journey_stages_admin_write on journey_stages for all to authenticated
  using (is_admin()) with check (is_admin());

revoke all on cohorts, groups, group_memberships, journey_stages from anon;
