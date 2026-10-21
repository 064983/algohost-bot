-- Run this file in Supabase Dashboard > SQL Editor on your new, empty project.
-- Unlocking IDs are manual only. This schema does not generate activation codes.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 1 and 100),
  category text not null,
  description text not null,
  platform text not null,
  features jsonb not null default '[]'::jsonb,
  compatibility text not null default '',
  price_zar numeric(10,2) not null check (price_zar >= 0),
  image_url text not null default '',
  activation_instructions text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id),
  product_id uuid not null references public.products(id),
  product_name text not null,
  amount_zar numeric(10,2) not null check (amount_zar >= 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_reference text not null unique,
  paystack_transaction_id text,
  customer_name text not null,
  customer_email text not null,
  whatsapp text not null default '',
  comments text not null default '' check (char_length(comments) <= 1500),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.license_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  product_id uuid not null references public.products(id),
  unlocking_id text not null,
  key_fingerprint text not null unique,
  activation_instructions text not null default '',
  active boolean not null default true,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index if not exists one_active_license_per_order
  on public.license_assignments(order_id) where active = true;

create table if not exists public.license_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  license_assignment_id uuid references public.license_assignments(id),
  admin_id uuid not null references public.profiles(id),
  action text not null check (action in ('assigned','replaced','revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  message text not null check (char_length(message) between 1 and 1500),
  created_at timestamptz not null default now()
);

create table if not exists public.order_message_rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  primary key (user_id, order_id)
);

create table if not exists public.checkout_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(key,value)
values ('whatsapp_number','27649838898')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.license_assignments enable row level security;
alter table public.license_history enable row level security;
alter table public.order_messages enable row level security;
alter table public.order_message_rate_limits enable row level security;
alter table public.checkout_rate_limits enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.order_message_rate_limits from public, anon, authenticated;

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
  for select to anon, authenticated using (active = true);
drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Owners can read paid active license IDs" on public.license_assignments;
create policy "Owners can read paid active license IDs" on public.license_assignments
  for select to authenticated using (
    active = true and exists (
      select 1 from public.orders o
      where o.id = license_assignments.order_id
        and o.user_id = auth.uid()
        and o.payment_status = 'paid'
    )
  );
drop policy if exists "Admins can read license assignment history" on public.license_history;
create policy "Admins can read license assignment history" on public.license_history
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "Customers can read own order messages" on public.order_messages;
create policy "Customers can read own order messages" on public.order_messages
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Customers can add messages to own orders" on public.order_messages;
revoke insert on public.order_messages from anon, authenticated;
drop policy if exists "Admins can read all order messages" on public.order_messages;
create policy "Admins can read all order messages" on public.order_messages
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create or replace function public.submit_order_message(p_order_id uuid, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_message text := btrim(coalesce(p_message, ''));
  v_count integer;
  v_message_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in required';
  end if;
  if char_length(v_message) < 1 or char_length(v_message) > 1500 then
    raise exception 'Message must be between 1 and 1500 characters';
  end if;
  if not exists (
    select 1 from public.orders
    where id = p_order_id and user_id = v_user_id
  ) then
    raise exception 'Order not found';
  end if;

  insert into public.order_message_rate_limits(user_id, order_id, window_started_at, attempt_count)
    values (v_user_id, p_order_id, now(), 1)
  on conflict (user_id, order_id) do update set
    attempt_count = case
      when public.order_message_rate_limits.window_started_at < now() - interval '10 minutes' then 1
      else public.order_message_rate_limits.attempt_count + 1 end,
    window_started_at = case
      when public.order_message_rate_limits.window_started_at < now() - interval '10 minutes' then now()
      else public.order_message_rate_limits.window_started_at end
  returning attempt_count into v_count;
  if v_count > 5 then
    raise exception 'Message limit reached. Please wait and try again later.';
  end if;

  insert into public.order_messages(order_id, user_id, message)
    values (p_order_id, v_user_id, v_message)
    returning id into v_message_id;
  return v_message_id;
end;
$$;
revoke all on function public.submit_order_message(uuid, text) from public, anon;
grant execute on function public.submit_order_message(uuid, text) to authenticated;

create or replace function public.check_checkout_rate_limit(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  insert into public.checkout_rate_limits(user_id, window_started_at, attempt_count)
    values (p_user_id, now(), 1)
  on conflict (user_id) do update set
    attempt_count = case
      when public.checkout_rate_limits.window_started_at < now() - interval '10 minutes' then 1
      else public.checkout_rate_limits.attempt_count + 1 end,
    window_started_at = case
      when public.checkout_rate_limits.window_started_at < now() - interval '10 minutes' then now()
      else public.checkout_rate_limits.window_started_at end
  returning attempt_count into v_count;
  if v_count > 5 then raise exception 'Checkout limit reached. Please wait and try again later.'; end if;
end;
$$;
revoke all on function public.check_checkout_rate_limit(uuid) from public, anon, authenticated;
grant execute on function public.check_checkout_rate_limit(uuid) to service_role;

create or replace function public.admin_assign_unlocking_id(p_order_id uuid, p_unlocking_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_old public.license_assignments%rowtype;
  v_fingerprint text;
  v_new_id uuid;
  v_action text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_unlocking_id is null or char_length(btrim(p_unlocking_id)) < 4 or char_length(p_unlocking_id) > 300 then
    raise exception 'Enter a valid existing activation ID';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_status <> 'paid' then
    raise exception 'A verified paid order is required before assigning an ID';
  end if;

  v_fingerprint := encode(extensions.digest(convert_to(btrim(p_unlocking_id), 'UTF8'), 'sha256'), 'hex');
  if exists (select 1 from public.license_assignments where key_fingerprint = v_fingerprint) then
    raise exception 'This activation ID has already been used; IDs cannot be duplicated';
  end if;

  select * into v_old from public.license_assignments
    where order_id = p_order_id and active = true for update;
  if found then
    update public.license_assignments set active = false, revoked_at = now() where id = v_old.id;
    insert into public.license_history(order_id, license_assignment_id, admin_id, action)
      values (p_order_id, v_old.id, auth.uid(), 'replaced');
    v_action := 'replaced';
  else
    v_action := 'assigned';
  end if;

  insert into public.license_assignments(
    order_id, product_id, unlocking_id, key_fingerprint, activation_instructions, assigned_by
  ) values (
    p_order_id, v_order.product_id, btrim(p_unlocking_id), v_fingerprint,
    coalesce((select activation_instructions from public.products where id = v_order.product_id), ''),
    auth.uid()
  ) returning id into v_new_id;
  insert into public.license_history(order_id, license_assignment_id, admin_id, action)
    values (p_order_id, v_new_id, auth.uid(), v_action);
end;
$$;

create or replace function public.admin_revoke_unlocking_id(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_license public.license_assignments%rowtype;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  select * into v_license from public.license_assignments
    where order_id = p_order_id and active = true for update;
  if not found then raise exception 'No active unlocking ID exists for this order'; end if;
  update public.license_assignments set active = false, revoked_at = now() where id = v_license.id;
  insert into public.license_history(order_id, license_assignment_id, admin_id, action)
    values (p_order_id, v_license.id, auth.uid(), 'revoked');
end;
$$;

revoke all on function public.admin_assign_unlocking_id(uuid, text) from public;
revoke all on function public.admin_revoke_unlocking_id(uuid) from public;
grant execute on function public.admin_assign_unlocking_id(uuid, text) to authenticated;
grant execute on function public.admin_revoke_unlocking_id(uuid) to authenticated;

-- Starter catalog: examples only; confirm every description, compatibility detail, and price.
insert into public.products (slug,name,category,description,platform,features,compatibility,price_zar)
values
  ('mt4-forex-starter','MT4 Forex Starter','MetaTrader 4 (MT4) Forex Bots','Sample listing for a MetaTrader 4 trading tool. Confirm features and compatibility with the seller before ordering.','MetaTrader 4','["MT4 compatible","Manual activation ID","Setup guidance"]'::jsonb,'Confirm your MetaTrader 4 build and requirements with the seller.',499.00),
  ('mt5-forex-starter','MT5 Forex Starter','MetaTrader 5 (MT5) Forex Bots','Sample listing for a MetaTrader 5 trading tool. Confirm features and compatibility with the seller before ordering.','MetaTrader 5','["MT5 compatible","Manual activation ID","Setup guidance"]'::jsonb,'Confirm your MetaTrader 5 build and requirements with the seller.',499.00),
  ('mt5-trend-suite','MT5 Trend Suite','Trend-Following Bots','Sample listing for a trend-following tool. No performance statistics are provided or implied.','MetaTrader 5','["MT5 compatible","Trend-following","Activation support"]'::jsonb,'Confirm your MetaTrader 5 build and requirements with the seller.',699.00),
  ('crypto-signal-tool','Crypto Signal Tool','Crypto Trading Bots','Sample listing for a crypto trading tool. Check supported exchanges and compatibility before purchase.','To be confirmed','["Compatibility check","Manual activation ID","Seller support"]'::jsonb,'Ask the seller to confirm supported exchanges and software version.',599.00),
  ('mt5-scalp-assist','MT5 Scalp Assist','Scalping Bots','Placeholder listing. Replace this description with verified product information before enabling sales.','MetaTrader 5','["Sample feature","Manual activation ID"]'::jsonb,'Confirm platform and version before purchase.',549.00),
  ('custom-trading-tool','Custom Trading Tool','Custom Trading Bots','Placeholder listing for custom arrangements. Discuss requirements with the seller before ordering.','To be confirmed','["Custom requirements","WhatsApp support"]'::jsonb,'Must be confirmed with the seller before purchase.',799.00)
on conflict (slug) do nothing;
