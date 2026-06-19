-- Phase 2: Auth, profiles, and invite system

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                  uuid        primary key references auth.users on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  role                text        not null default 'customer'
                                  check (role in ('admin', 'driver', 'customer')),
  name                text        not null default '',
  phone               text,
  avatar_url          text,
  status              text        not null default 'active'
                                  check (status in ('active', 'suspended', 'pending')),
  onboarding_complete boolean     not null default false
);

-- Customer extension row (1:1 with profiles where role = 'customer')
create table if not exists public.customers (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  profile_id          uuid        not null unique references public.profiles on delete cascade,
  company             text,
  default_address_id  uuid        -- FK to customer_addresses added in a later migration
);

-- Driver extension row (1:1 with profiles where role = 'driver')
create table if not exists public.drivers (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  profile_id          uuid        not null unique references public.profiles on delete cascade,
  verification_status text        not null default 'pending'
                                  check (verification_status in ('pending', 'under_review', 'approved', 'rejected')),
  rating              numeric(3,2) not null default 0,
  current_vehicle_id  uuid,       -- FK to vehicles added in Phase 3 migration
  availability        jsonb,
  online              boolean     not null default false,
  current_location    jsonb
);

-- Invite tokens (used by admin to invite drivers and other admins)
create table if not exists public.invite_tokens (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text        not null,
  role        text        not null check (role in ('admin', 'driver')),
  token       uuid        not null unique default gen_random_uuid(),
  created_by  uuid        references public.profiles on delete set null,
  used_at     timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days')
);

-- ── Trigger: auto-create profile (and extension row) on new auth user ──────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  _role text;
begin
  _role := coalesce(new.raw_user_meta_data->>'role', 'customer');

  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    _role
  );

  if _role = 'customer' then
    insert into public.customers (profile_id) values (new.id);
  elsif _role = 'driver' then
    insert into public.drivers (profile_id) values (new.id);
  end if;

  -- Mark invite token as used when the invited user completes signup
  if new.raw_user_meta_data->>'invite_token' is not null then
    update public.invite_tokens
    set used_at = now()
    where token    = (new.raw_user_meta_data->>'invite_token')::uuid
      and email    = new.email
      and used_at  is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at helper ──────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute procedure public.set_updated_at();

create trigger drivers_set_updated_at
  before update on public.drivers
  for each row execute procedure public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.customers     enable row level security;
alter table public.drivers       enable row level security;
alter table public.invite_tokens enable row level security;

-- SECURITY DEFINER bypasses RLS to avoid recursion when the policy itself
-- queries the profiles table.
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles ─────────────────────────────────────────────────────────────────────

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin());

-- customers ────────────────────────────────────────────────────────────────────

create policy "customers_select_own"
  on public.customers for select to authenticated
  using (profile_id = auth.uid());

create policy "customers_select_admin"
  on public.customers for select to authenticated
  using (public.is_admin());

create policy "customers_update_own"
  on public.customers for update to authenticated
  using (profile_id = auth.uid());

create policy "customers_all_admin"
  on public.customers for all to authenticated
  using (public.is_admin());

-- drivers ──────────────────────────────────────────────────────────────────────

create policy "drivers_select_own"
  on public.drivers for select to authenticated
  using (profile_id = auth.uid());

create policy "drivers_select_admin"
  on public.drivers for select to authenticated
  using (public.is_admin());

create policy "drivers_update_own"
  on public.drivers for update to authenticated
  using (profile_id = auth.uid());

create policy "drivers_all_admin"
  on public.drivers for all to authenticated
  using (public.is_admin());

-- invite_tokens ────────────────────────────────────────────────────────────────

-- Allow anyone (including anon) to read valid tokens so the invite-accept
-- page can validate a token before the user has created an account.
create policy "invite_tokens_select_valid"
  on public.invite_tokens for select
  using (used_at is null and expires_at > now());

create policy "invite_tokens_select_admin"
  on public.invite_tokens for select to authenticated
  using (public.is_admin());

create policy "invite_tokens_insert_admin"
  on public.invite_tokens for insert to authenticated
  with check (public.is_admin());

create policy "invite_tokens_update_admin"
  on public.invite_tokens for update to authenticated
  using (public.is_admin());
