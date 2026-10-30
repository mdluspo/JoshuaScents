-- Targeted repair for an existing store whose account tables were not deployed.
-- Run in the SAME Supabase project used by VITE_SUPABASE_URL, as the SQL editor
-- owner. This is not a database reset and does not alter users or profile roles.
-- It may be rerun. Existing rows remain; the two account tables' API policies
-- are replaced with owner-only policies. Review custom policies before running.
-- Afterwards apply the separate security_hardening migration if not yet applied.
begin;

do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Base store schema is missing. Apply the store schema migration first; do not reset an existing database.';
  end if;
end;
$$;

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists addresses_one_default_per_user
  on public.addresses (user_id) where is_default;

alter table public.favorites enable row level security;
alter table public.addresses enable row level security;

-- Permissive policies combine with OR, so replace policies on these exact two
-- tables instead of leaving an accidentally broad policy alongside new ones.
do $$
declare account_policy record;
begin
  for account_policy in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('favorites', 'addresses')
  loop
    execute format('drop policy %I on public.%I', account_policy.policyname, account_policy.tablename);
  end loop;
end;
$$;

revoke all on public.favorites, public.addresses from public, anon, authenticated;
grant all on public.favorites, public.addresses to service_role;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

create policy "users see their favorites" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users add their favorites" on public.favorites
  for insert to authenticated with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.products where products.id = favorites.product_id and products.is_active
    )
  );
create policy "users delete their favorites" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "users see their addresses" on public.addresses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users add their addresses" on public.addresses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update their addresses" on public.addresses
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users delete their addresses" on public.addresses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Delivered only if the transaction commits, so PostgREST sees the new tables.
notify pgrst, 'reload schema';
commit;

-- Metadata checks only: no customer data is returned.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('authenticated', c.oid, 'SELECT') as customer_can_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') as customer_can_insert,
  has_table_privilege('anon', c.oid, 'SELECT') as guest_can_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('favorites', 'addresses');
