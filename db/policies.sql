-- Plate — Row Level Security policies (spec section 4 summary).
-- Run AFTER db/schema.sql. Idempotent (drops policies before recreating).
--
-- Recursion note: household-scoped policies must NOT query household_members
-- from inside a household_members policy directly, or Postgres recurses.
-- The helper functions below are SECURITY DEFINER, so they read with RLS
-- bypassed and break the cycle.

-- ---------------------------------------------------------------------------
-- Table privileges. Tables created via raw SQL do NOT auto-grant to Supabase's
-- anon/authenticated roles, so RLS-protected queries fail with
-- "permission denied for table ..." before RLS is even evaluated. RLS still
-- enforces per-row access on top of these grants.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.shares_household(other uuid)
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select exists (
    select 1
    from public.household_members m_self
    join public.household_members m_other
      on m_self.household_id = m_other.household_id
    where m_self.user_id = auth.uid()
      and m_other.user_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- users — own record only
-- ---------------------------------------------------------------------------
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- households / household_members — visible to members
-- ---------------------------------------------------------------------------
drop policy if exists households_select_member on public.households;
create policy households_select_member on public.households
  for select to authenticated
  using (public.is_household_member(id));

drop policy if exists household_members_select_member on public.household_members;
create policy household_members_select_member on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- recipes — shared reference data, any authenticated household user
-- ---------------------------------------------------------------------------
drop policy if exists recipes_select_all on public.recipes;
create policy recipes_select_all on public.recipes
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- plans / meal_slots / grocery_items — scoped to the household's plan
-- ---------------------------------------------------------------------------
drop policy if exists plans_select_member on public.plans;
create policy plans_select_member on public.plans
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists meal_slots_select_member on public.meal_slots;
create policy meal_slots_select_member on public.meal_slots
  for select to authenticated
  using (
    exists (
      select 1 from public.plans pl
      where pl.id = meal_slots.plan_id
        and public.is_household_member(pl.household_id)
    )
  );

drop policy if exists grocery_items_select_member on public.grocery_items;
create policy grocery_items_select_member on public.grocery_items
  for select to authenticated
  using (
    exists (
      select 1 from public.plans pl
      where pl.id = grocery_items.plan_id
        and public.is_household_member(pl.household_id)
    )
  );

-- ---------------------------------------------------------------------------
-- supplements / supplement_logs — strictly per-user
-- ---------------------------------------------------------------------------
drop policy if exists supplements_all_own on public.supplements;
create policy supplements_all_own on public.supplements
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists supplement_logs_all_own on public.supplement_logs;
create policy supplement_logs_all_own on public.supplement_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- meal_logs — readable across the household (Stats shows both users'
-- averages, DoD: both can rate the same meal); writable only by the author.
-- ---------------------------------------------------------------------------
drop policy if exists meal_logs_select_household on public.meal_logs;
create policy meal_logs_select_household on public.meal_logs
  for select to authenticated
  using (user_id = auth.uid() or public.shares_household(user_id));

drop policy if exists meal_logs_insert_own on public.meal_logs;
create policy meal_logs_insert_own on public.meal_logs
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists meal_logs_update_own on public.meal_logs;
create policy meal_logs_update_own on public.meal_logs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists meal_logs_delete_own on public.meal_logs;
create policy meal_logs_delete_own on public.meal_logs
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- grocery_checks — shared across the household (both see each other's ticks)
-- ---------------------------------------------------------------------------
drop policy if exists grocery_checks_select_member on public.grocery_checks;
create policy grocery_checks_select_member on public.grocery_checks
  for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists grocery_checks_insert_member on public.grocery_checks;
create policy grocery_checks_insert_member on public.grocery_checks
  for insert to authenticated
  with check (public.is_household_member(household_id));

drop policy if exists grocery_checks_update_member on public.grocery_checks;
create policy grocery_checks_update_member on public.grocery_checks
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- push_subscriptions / notification_log — per-user
-- (cron dispatch uses the service role, which bypasses RLS)
-- ---------------------------------------------------------------------------
drop policy if exists push_subscriptions_all_own on public.push_subscriptions;
create policy push_subscriptions_all_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notification_log_select_own on public.notification_log;
create policy notification_log_select_own on public.notification_log
  for select to authenticated
  using (user_id = auth.uid());

-- app_config has RLS enabled and intentionally NO policies: only the
-- SECURITY DEFINER signup trigger and the service role touch it.

