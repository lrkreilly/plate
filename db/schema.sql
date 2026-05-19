-- Plate — schema (spec section 4 + decided deviations)
-- Run once in Supabase SQL Editor. Idempotent where practical.
-- Order: extensions -> tables -> helper fns -> triggers. RLS policies live in db/policies.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

-- public.users.id mirrors auth.users.id (1:1). Rows are created by the
-- handle_new_user trigger on auth.users, never directly by the app.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Drives the new-user signup trigger (which household to join, who is owner).
-- Seed sets the single row. Singleton enforced by the constant primary key.
create table if not exists public.app_config (
  id boolean primary key default true check (id),
  household_id uuid references public.households(id) on delete set null,
  owner_email text
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  protein_tag text,
  prep_time text not null,
  cooking_method text,
  ingredients jsonb not null,
  notes text,
  steps jsonb not null,
  image_url text,
  image_search_term text,
  cook_double boolean not null default false,
  default_servings int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  current_week int not null default 1 check (current_week in (1, 2)),
  week_started_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  week int not null check (week in (1, 2)),
  day_of_week int not null check (day_of_week between 1 and 5), -- ISO: Mon=1..Fri=5
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  unique (plan_id, week, day_of_week, meal_type)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  week int not null check (week in (1, 2)),
  name text not null,
  quantity text,
  category text not null check (category in ('protein', 'produce', 'pantry', 'dairy')),
  display_order int not null default 0
);

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  dose text not null,
  schedule text not null,
  notification_time time,
  enabled boolean not null default true,
  display_order int not null default 0,
  notes text
);

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  date date not null,
  taken_at timestamptz not null default now(),
  unique (user_id, supplement_id, date)
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_slot_id uuid not null references public.meal_slots(id) on delete cascade,
  date date not null,
  rating int check (rating between 1 and 5),
  kids_verdict text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.grocery_checks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  grocery_item_id uuid not null references public.grocery_items(id) on delete cascade,
  week_starting date not null,
  checked boolean not null default false,
  checked_by uuid references public.users(id) on delete set null,
  unique (household_id, grocery_item_id, week_starting)
);

-- ---------------------------------------------------------------------------
-- Tables not in spec section 4 (decided deviations)
-- ---------------------------------------------------------------------------

-- Web Push subscriptions, one per installed PWA instance per user.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Dedupe ledger so the every-5-minute notification cron never double-fires.
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('morning_stack', 'slow_cooker', 'evening_magnesium')),
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New-user provisioning: create public.users row + auto-join the seeded
-- household (spec F1). SECURITY DEFINER so it can write past RLS during signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.app_config%rowtype;
  member_role text;
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  select * into cfg from public.app_config where id is true;

  if cfg.household_id is not null then
    member_role := case
      when cfg.owner_email is not null and lower(cfg.owner_email) = lower(new.email)
        then 'owner'
      else 'member'
    end;

    insert into public.household_members (household_id, user_id, role)
    values (cfg.household_id, new.id, member_role)
    on conflict (household_id, user_id) do nothing;
  end if;

  -- Seed this user's default supplement stack (spec section 7). Per-user data
  -- can only be created once the auth user exists, so it lives here rather
  -- than in db/seed. Guarded so it never double-seeds.
  if not exists (select 1 from public.supplements where user_id = new.id) then
    insert into public.supplements
      (user_id, name, dose, schedule, notification_time, enabled, display_order)
    values
      (new.id, 'L-Theanine', '200 mg', 'morning_coffee', time '07:30', true, 1),
      (new.id, 'Vitamin D3', '1000-2000 IU', 'morning_breakfast', time '07:30', true, 2),
      (new.id, 'Salmon Oil', '1-2 g EPA+DHA', 'with_meal', time '07:30', true, 3),
      (new.id, 'Creatine Monohydrate', '5 g', 'anytime', null, true, 4),
      (new.id, 'Magnesium Glycinate', '200-400 mg', 'evening_bedtime', time '21:30', true, 5);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS on every table. Policies are defined in db/policies.sql.
-- ---------------------------------------------------------------------------
alter table public.users              enable row level security;
alter table public.households         enable row level security;
alter table public.household_members  enable row level security;
alter table public.app_config         enable row level security;
alter table public.recipes            enable row level security;
alter table public.plans              enable row level security;
alter table public.meal_slots         enable row level security;
alter table public.grocery_items      enable row level security;
alter table public.supplements        enable row level security;
alter table public.supplement_logs    enable row level security;
alter table public.meal_logs          enable row level security;
alter table public.grocery_checks     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_log   enable row level security;
