-- 0013 «الموارد»: resources with audiences, private storage, and the ten «أعراف الرحلة»
-- (data-model.md; FR-050, FR-051, FR-063).

create type resource_type as enum ('recording', 'file', 'reference');
create type resource_audience as enum ('program', 'cohorts', 'groups');

create table resources (
  id uuid primary key default gen_random_uuid(),
  type resource_type not null,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (char_length(description) <= 1000),
  category text check (char_length(category) <= 60),
  sort_order int not null default 0,
  storage_path text check (storage_path ~ '^[A-Za-z0-9/_.-]+$'),
  url text check (url ~ '^https?://'),
  audience resource_audience not null default 'program',
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type = 'reference' or storage_path is not null or url is not null),
  check (type <> 'reference' or url is not null or storage_path is not null)
);

create table resource_audiences (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources (id) on delete cascade,
  cohort_id uuid references cohorts (id) on delete cascade,
  group_id uuid references groups (id) on delete cascade,
  check (num_nonnulls(cohort_id, group_id) = 1)
);
create index resource_audiences_resource on resource_audiences (resource_id);

create table guidelines (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number between 1 and 10),
  text text not null check (char_length(btrim(text)) between 2 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger resources_updated_at before update on resources for each row execute function set_updated_at();
create trigger guidelines_updated_at before update on guidelines for each row execute function set_updated_at();

-- The caller is in the resource's audience (current memberships).
create function can_see_resource(p_resource uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_audience resource_audience;
begin
  select audience into v_audience from resources where id = p_resource;
  if v_audience is null then return false; end if;
  if v_audience = 'program' then return auth.uid() is not null; end if;
  return exists (
    select 1 from resource_audiences ra
    where ra.resource_id = p_resource
      and ((ra.group_id is not null and is_group_member(ra.group_id))
        or (ra.cohort_id is not null and is_active_in_cohort(ra.cohort_id)))
  );
end $$;

alter table resources enable row level security;
alter table resource_audiences enable row level security;
alter table guidelines enable row level security;
revoke all on resources, resource_audiences, guidelines from anon;
create policy resources_select on resources for select to authenticated using (is_admin() or can_see_resource(id));
create policy resources_admin on resources for all to authenticated using (is_admin()) with check (is_admin());
create policy resource_audiences_select on resource_audiences for select to authenticated using (is_admin() or can_see_resource(resource_id));
create policy resource_audiences_admin on resource_audiences for all to authenticated using (is_admin()) with check (is_admin());
create policy guidelines_select on guidelines for select to authenticated using (true);
create policy guidelines_admin on guidelines for all to authenticated using (is_admin()) with check (is_admin());

-- ── Storage: private bucket; reads only for the resource's audience; writes admin-only ──
insert into storage.buckets (id, name, public) values ('resources', 'resources', false) on conflict (id) do nothing;

create function can_read_resource_object(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from resources r where r.storage_path = p_name and can_see_resource(r.id));
$$;

create policy resources_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'resources' and can_read_resource_object(name));
create policy resources_objects_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'resources' and is_admin());
create policy resources_objects_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'resources' and is_admin());
create policy resources_objects_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'resources' and is_admin());

-- Create or edit a resource and replace its audience (SECURITY INVOKER: admin RLS applies).
create function save_resource(
  p_id uuid default null, p_type resource_type default null, p_title text default null,
  p_description text default null, p_category text default null, p_storage_path text default null,
  p_url text default null, p_audience resource_audience default 'program',
  p_cohort_ids uuid[] default null, p_group_ids uuid[] default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if p_audience = 'cohorts' and coalesce(array_length(p_cohort_ids, 1), 0) = 0
     or p_audience = 'groups' and coalesce(array_length(p_group_ids, 1), 0) = 0 then
    raise exception 'invalid_input: audience needs at least one cohort or group';
  end if;
  if p_id is null then
    insert into resources (type, title, description, category, storage_path, url, audience, created_by,
                           sort_order)
    values (p_type, btrim(p_title), nullif(btrim(p_description), ''), nullif(btrim(p_category), ''),
            nullif(p_storage_path, ''), nullif(btrim(p_url), ''), p_audience, auth.uid(),
            coalesce((select max(sort_order) from resources), 0) + 1)
    returning id into v_id;
  else
    update resources
    set type = p_type, title = btrim(p_title), description = nullif(btrim(p_description), ''),
        category = nullif(btrim(p_category), ''),
        storage_path = coalesce(nullif(p_storage_path, ''), storage_path),
        url = nullif(btrim(p_url), ''), audience = p_audience
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'not_found'; end if;
    delete from resource_audiences where resource_id = v_id;
  end if;
  if p_audience = 'cohorts' then
    insert into resource_audiences (resource_id, cohort_id) select v_id, c from unnest(p_cohort_ids) c group by c;
  elsif p_audience = 'groups' then
    insert into resource_audiences (resource_id, group_id) select v_id, g from unnest(p_group_ids) g group by g;
  end if;
  return v_id;
end $$;

create function reorder_resources(p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update resources r set sort_order = o.pos from unnest(p_ids) with ordinality as o(id, pos) where r.id = o.id;
$$;

revoke execute on function can_read_resource_object(text) from public, anon;
grant execute on function can_read_resource_object(text) to authenticated;
revoke execute on function save_resource(uuid, resource_type, text, text, text, text, text, resource_audience, uuid[], uuid[]), reorder_resources(uuid[]) from public, anon;
grant execute on function save_resource(uuid, resource_type, text, text, text, text, text, resource_audience, uuid[], uuid[]), reorder_resources(uuid[]) to authenticated;
