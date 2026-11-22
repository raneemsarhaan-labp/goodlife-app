-- 0021 First-admin bootstrap for a new deployment. Forward-only.
-- scripts/migrate.mjs writes the launch admin's email here (from BOOTSTRAP_ADMIN_EMAIL) and creates a
-- starter cohort, group and invitation code. The person who joins with that email becomes admin, but
-- only while the app has no admin at all; after that this table has no effect.

create table app_bootstrap (
  id boolean primary key default true check (id),
  admin_email text not null check (admin_email ~ '^[^@\s]+@[^@\s]+$'),
  created_at timestamptz not null default now()
);
alter table app_bootstrap enable row level security;
revoke all on app_bootstrap from anon, authenticated;   -- no policies: server-side only

-- Grants admin to the bootstrap email when there is no admin yet.
create function bootstrap_admin(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from user_roles where role = 'admin') then return false; end if;
  if not exists (select 1 from app_bootstrap b join users u on lower(u.email) = lower(b.admin_email) where u.id = p_user) then
    return false;
  end if;
  insert into user_roles (user_id, role) values (p_user, 'admin') on conflict do nothing;
  return true;
end $$;
revoke execute on function bootstrap_admin(uuid) from public, anon, authenticated;

create function users_bootstrap_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform bootstrap_admin(new.id);
  return new;
end $$;
create trigger users_bootstrap_admin after insert on users for each row execute function users_bootstrap_admin();
