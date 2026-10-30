begin;

-- Browser clients never receive administrative table privileges. Admin APIs
-- verify the access token and database role, then use service_role server-side.
revoke all on public.profiles, public.addresses, public.favorites, public.orders,
  public.order_items, public.products, public.product_variants, public.integration_events
  from public, anon, authenticated;
grant all on public.profiles, public.addresses, public.favorites, public.orders,
  public.order_items, public.products, public.product_variants, public.integration_events to service_role;
grant select on public.products, public.product_variants to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items to authenticated;
grant update (full_name, phone, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert, delete on public.favorites to authenticated;

alter table public.integration_events enable row level security;
drop policy if exists "admins see all profiles" on public.profiles;
drop policy if exists "admins see all orders" on public.orders;
drop policy if exists "admins update all orders" on public.orders;
drop policy if exists "admins see all order items" on public.order_items;
drop policy if exists "admins manage products" on public.products;
drop policy if exists "admins manage variants" on public.product_variants;

drop policy if exists "users update their profile" on public.profiles;
create policy "users update their profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "variants are public" on public.product_variants;
create policy "active variants are public" on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products where products.id = product_variants.product_id and products.is_active));
drop policy if exists "users add their favorites" on public.favorites;
create policy "users add their favorites" on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.products where products.id = favorites.product_id and products.is_active));

-- Defense in depth against accidental restoration of broad UPDATE grants.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.role is distinct from old.role and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise insufficient_privilege using message = 'Profile roles are managed by trusted administrators only';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update of role on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke all on function public.create_store_order from public, anon, authenticated;
grant execute on function public.create_store_order to service_role;
alter function public.create_store_order(text, public.payment_method, integer, integer, integer, text, text, text, text, text, text, numeric, numeric, text, jsonb) set search_path = '';

-- NOT VALID preserves pre-existing rows during migration; PostgreSQL still
-- enforces these checks for new writes. Clean legacy data before validating.
alter table public.profiles add constraint profiles_bounded_text check (
  (full_name is null or (length(full_name) <= 100 and full_name !~ '[<>[:cntrl:]]')) and
  (phone is null or (length(phone) <= 30 and phone !~ '[<>[:cntrl:]]'))
) not valid;
alter table public.addresses add constraint addresses_bounded_text check (
  length(label) between 1 and 60 and length(recipient_name) between 1 and 100 and
  length(phone) between 1 and 30 and length(address_line) between 1 and 300 and
  length(city) between 1 and 100 and length(postal_code) between 1 and 12 and
  (label || recipient_name || phone || address_line || city || postal_code) !~ '[<>[:cntrl:]]'
) not valid;
alter table public.orders add constraint orders_safe_tracking_url check (
  tracking_url is null or (length(tracking_url) <= 500 and tracking_url ~ '^https://[^/[:space:]<>]+(/[^[:space:]<>]*)?$' and tracking_url !~ '^https://[^/]*@')
) not valid;

commit;
