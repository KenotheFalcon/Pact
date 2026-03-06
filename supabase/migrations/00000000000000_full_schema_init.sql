-- ============================================================================
-- PACT MARKETPLACE - FULL DATABASE INITIALIZATION
-- ============================================================================
-- This file consolidates all schema and migrations in the correct order.
-- Run this in Supabase Dashboard SQL Editor to initialize the database.
-- 
-- Order of operations:
-- 1. Create extensions and types
-- 2. Create base tables (profiles, listings, pools, orders, pool_members, etc.)
-- 3. Enable RLS and create policies
-- 4. Create functions and triggers
-- 5. Create storage bucket
-- 6. Apply pool improvements (payouts table, updated RPCs)
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS AND TYPES
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create the app_role enum type (used by handle_new_user trigger)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('buyer', 'farmer', 'admin');
    END IF;
END $$;

-- ============================================================================
-- PART 2: BASE TABLES
-- ============================================================================

-- Profiles Table (Extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text check (role in ('buyer', 'farmer', 'admin')) default 'buyer',
  display_name text,
  full_name text,
  phone text,
  avatar_url text,
  address text,
  city text,
  country text,
  bio text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  total_reviews integer,
  is_verified boolean default false,
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Listings Table
create table if not exists public.listings (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  price_per_unit numeric not null,
  unit text not null,
  quantity integer default 0,
  min_pool_qty integer default 1,
  images jsonb default '[]'::jsonb,
  organic boolean default false,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  country text,
  harvest_date timestamp with time zone,
  expiry_date timestamp with time zone,
  status text check (status in ('available', 'sold_out', 'expired', 'inactive')) default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pools Table
create table if not exists public.pools (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  leader_id uuid references public.profiles(id) on delete set null,
  min_quantity integer not null,
  current_quantity integer default 0,
  expires_at timestamp with time zone not null,
  status text check (status in ('active', 'locked', 'funded', 'completed', 'cancelled', 'expired')) default 'active',
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) not null,
  pool_id uuid references public.pools(id) not null,
  listing_id uuid references public.listings(id),
  quantity integer not null,
  amount numeric not null,
  payment_status text check (payment_status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  status text check (status in ('pending', 'confirmed', 'delivered', 'cancelled')) default 'pending',
  payment_reference text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pool Members Table
create table if not exists public.pool_members (
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quantity_pledged integer not null,
  amount_pledged numeric not null,
  payment_status text check (payment_status in ('pending', 'authorized', 'captured', 'voided')) default 'pending',
  payment_reference text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (pool_id, user_id)
);

-- Pool Chat Table
create table if not exists public.pool_chat (
  id uuid default uuid_generate_v4() primary key,
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Contact Submissions Table
create table if not exists public.contact_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payouts Table (from pool improvements)
create table if not exists public.payouts (
  id uuid default uuid_generate_v4() primary key,
  pool_id uuid references public.pools(id) on delete cascade not null,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  amount bigint not null, -- Amount in kobo (smallest currency unit)
  platform_fee bigint not null default 0, -- Platform fee in kobo
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  reference text unique not null,
  transfer_code text,
  failure_reason text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.pools enable row level security;
alter table public.orders enable row level security;
alter table public.pool_members enable row level security;
alter table public.pool_chat enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.payouts enable row level security;

-- ============================================================================
-- PART 4: RLS POLICIES
-- ============================================================================

-- === PROFILES POLICIES ===
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

drop policy if exists "Admins can update any profile." on profiles;
create policy "Admins can update any profile."
  on profiles for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- === LISTINGS POLICIES ===
drop policy if exists "Listings are viewable by everyone." on listings;
create policy "Listings are viewable by everyone."
  on listings for select
  using ( true );

drop policy if exists "Farmers can insert their own listings." on listings;
create policy "Farmers can insert their own listings."
  on listings for insert
  with check ( (select auth.uid()) = farmer_id );

drop policy if exists "Farmers can update their own listings." on listings;
create policy "Farmers can update their own listings."
  on listings for update
  using ( (select auth.uid()) = farmer_id );

drop policy if exists "Admins can update any listing." on listings;
create policy "Admins can update any listing."
  on listings for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Admins can delete any listing." on listings;
create policy "Admins can delete any listing."
  on listings for delete
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- === POOLS POLICIES ===
drop policy if exists "Pools are viewable by everyone." on pools;
create policy "Pools are viewable by everyone."
  on pools for select
  using ( true );

drop policy if exists "Authenticated users can create pools." on pools;
create policy "Authenticated users can create pools."
  on pools for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Admins can update any pool." on pools;
create policy "Admins can update any pool."
  on pools for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Admins can delete any pool." on pools;
create policy "Admins can delete any pool."
  on pools for delete
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- === ORDERS POLICIES ===
drop policy if exists "Users can view their own orders." on orders;
create policy "Users can view their own orders."
  on orders for select
  using ( (select auth.uid()) = buyer_id );

drop policy if exists "Users can create orders." on orders;
create policy "Users can create orders."
  on orders for insert
  with check ( (select auth.uid()) = buyer_id );

drop policy if exists "Users can update their own orders." on orders;
create policy "Users can update their own orders."
  on orders for update
  using ( (select auth.uid()) = buyer_id );

drop policy if exists "Admins can view all orders." on orders;
create policy "Admins can view all orders."
  on orders for select
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Admins can update any order." on orders;
create policy "Admins can update any order."
  on orders for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Farmers can view orders for their listings." on orders;
create policy "Farmers can view orders for their listings."
  on orders for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = orders.listing_id
        and l.farmer_id = (select auth.uid())
    )
    or
    exists (
      select 1 from public.pools p
      join public.listings l on l.id = p.listing_id
      where p.id = orders.pool_id
        and l.farmer_id = (select auth.uid())
    )
  );

-- === POOL MEMBERS POLICIES ===
drop policy if exists "Pool members are viewable by all." on pool_members;
create policy "Pool members are viewable by all."
  on pool_members for select
  using ( true );

drop policy if exists "Users can join pools." on pool_members;
create policy "Users can join pools."
  on pool_members for insert
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Users can update their own pool membership." on pool_members;
create policy "Users can update their own pool membership."
  on pool_members for update
  using ( (select auth.uid()) = user_id );

-- === POOL CHAT POLICIES ===
drop policy if exists "Pool chat is viewable by all." on pool_chat;
create policy "Pool chat is viewable by all."
  on pool_chat for select
  using ( true );

drop policy if exists "Users can post to pool chat." on pool_chat;
create policy "Users can post to pool chat."
  on pool_chat for insert
  with check ( (select auth.uid()) = user_id );

-- === NOTIFICATIONS POLICIES ===
drop policy if exists "Users can view their own notifications." on notifications;
create policy "Users can view their own notifications."
  on notifications for select
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can mark their own notifications as read." on notifications;
create policy "Users can mark their own notifications as read."
  on notifications for update
  using ( (select auth.uid()) = user_id );

drop policy if exists "System can insert notifications." on notifications;
create policy "System can insert notifications."
  on notifications for insert
  with check ( true );

-- === CONTACT SUBMISSIONS POLICIES ===
drop policy if exists "Users can view their own contact submissions." on contact_submissions;
create policy "Users can view their own contact submissions."
  on contact_submissions for select
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) in (
      select id from public.profiles where role = 'admin'
    )
  );

drop policy if exists "Anyone can create contact submissions." on contact_submissions;
create policy "Anyone can create contact submissions."
  on contact_submissions for insert
  with check ( true );

drop policy if exists "Admins can update contact submissions." on contact_submissions;
create policy "Admins can update contact submissions."
  on contact_submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Admins can delete contact submissions." on contact_submissions;
create policy "Admins can delete contact submissions."
  on contact_submissions for delete
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- === PAYOUTS POLICIES ===
drop policy if exists "Farmers can view their own payouts." on payouts;
create policy "Farmers can view their own payouts."
  on payouts for select
  using ( (select auth.uid()) = farmer_id );

drop policy if exists "Admins can view all payouts." on payouts;
create policy "Admins can view all payouts."
  on payouts for select
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "Admins can update payouts." on payouts;
create policy "Admins can update payouts."
  on payouts for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "System can insert payouts." on payouts;
create policy "System can insert payouts."
  on payouts for insert
  with check ( true );

-- ============================================================================
-- PART 5: INDEXES
-- ============================================================================

create index if not exists idx_contact_submissions_user_id on public.contact_submissions(user_id);
create index if not exists idx_contact_submissions_email on public.contact_submissions(email);
create index if not exists idx_contact_submissions_status on public.contact_submissions(status);
create index if not exists idx_contact_submissions_created_at on public.contact_submissions(created_at desc);

create index if not exists idx_payouts_pool_id on public.payouts(pool_id);
create index if not exists idx_payouts_farmer_id on public.payouts(farmer_id);
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_payouts_created_at on public.payouts(created_at desc);

-- ============================================================================
-- PART 6: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ghost_id uuid;
  user_role public.app_role;
begin
  -- 1. Identify valid Ghost Profile (Same email, different ID)
  select id into ghost_id from public.profiles where email = new.email and id <> new.id;

  if ghost_id is not null then
    -- 2. Manually Cascade Delete Dependents
    delete from public.orders where buyer_id = ghost_id;
    delete from public.pools where leader_id = ghost_id;
    delete from public.listings where farmer_id = ghost_id;
    delete from public.pool_members where user_id = ghost_id;
    delete from public.pool_chat where user_id = ghost_id;
    delete from public.profiles where id = ghost_id;
  end if;

  -- 3. Determine role (default to 'buyer' if not provided or invalid)
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role, 
    'buyer'::public.app_role
  );

  -- 4. Create New Profile
  insert into public.profiles (id, email, display_name, avatar_url, role, email_verified)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    user_role,
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    role = case when public.profiles.role = 'buyer'::public.app_role and excluded.role is distinct from 'buyer'::public.app_role then excluded.role else public.profiles.role end;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger for new user signup (drop first to avoid duplicates)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: Increment pool quantity atomically
create or replace function public.increment_pool_quantity(pool_id_param uuid, quantity_param int)
returns void as $$
begin
  update public.pools
  set current_quantity = current_quantity + quantity_param,
      updated_at = timezone('utc'::text, now())
  where id = pool_id_param;
end;
$$ language plpgsql security definer set search_path = '';

-- RPC: Reserve pool membership with capacity check (updated version with status/expiry checks)
create or replace function public.reserve_pool_membership(
  pool_id_param uuid,
  user_id_param uuid,
  quantity_param int,
  amount_naira numeric,
  reference_param text
)
returns boolean as $$
declare
  v_pool_status text;
  v_expires_at timestamp with time zone;
  v_min_quantity int;
  v_listing_quantity int;
  v_max_quantity int;
  v_committed int;
begin
  -- Validate quantity
  if quantity_param is null or quantity_param <= 0 then
    raise exception 'Invalid quantity' using errcode = '22023';
  end if;

  -- Lock the pool row and read status, expiry, and listing capacity
  select p.status, p.expires_at, p.min_quantity, coalesce(l.quantity, 0)
    into v_pool_status, v_expires_at, v_min_quantity, v_listing_quantity
  from public.pools p
  join public.listings l on l.id = p.listing_id
  where p.id = pool_id_param
  for update;

  -- Check pool exists
  if v_min_quantity is null then
    raise exception 'Pool not found' using errcode = '02000';
  end if;

  -- Check pool status is active
  if v_pool_status <> 'active' then
    raise exception 'Pool is not active (status: %)', v_pool_status using errcode = '45001';
  end if;

  -- Check pool has not expired
  if v_expires_at is not null and v_expires_at <= timezone('utc'::text, now()) then
    raise exception 'Pool has expired' using errcode = '45002';
  end if;

  v_max_quantity := coalesce(v_listing_quantity, v_min_quantity);

  -- Sum all currently pledged units that count against capacity
  select coalesce(sum(quantity_pledged), 0)
    into v_committed
  from public.pool_members
  where pool_id = pool_id_param
    and payment_status in ('pending','authorized','captured');

  if v_committed + quantity_param > v_max_quantity then
    raise exception 'Insufficient capacity' using errcode = '45000';
  end if;

  -- Upsert reservation as pending with reference
  insert into public.pool_members (
    pool_id, user_id, quantity_pledged, amount_pledged, payment_status, payment_reference, joined_at
  ) values (
    pool_id_param, user_id_param, quantity_param, amount_naira, 'pending', reference_param, timezone('utc'::text, now())
  )
  on conflict (pool_id, user_id)
  do update set
    quantity_pledged = excluded.quantity_pledged,
    amount_pledged = excluded.amount_pledged,
    payment_status = 'pending',
    payment_reference = excluded.payment_reference,
    joined_at = excluded.joined_at;

  return true;
end;
$$ language plpgsql security definer set search_path = '';

-- RPC: Get farmer available balance
create or replace function public.get_farmer_available_balance(p_user_id uuid)
returns numeric as $$
declare
  v_balance numeric;
begin
  select coalesce(sum(amount), 0)
    into v_balance
  from public.orders
  where buyer_id = p_user_id
    and payment_status = 'paid'
    and status = 'confirmed';

  return v_balance;
end;
$$ language plpgsql security definer set search_path = '';

-- RPC: Auto generate payouts for a pool
create or replace function public.auto_generate_payouts(
  pool_id_param uuid,
  platform_fee_percent numeric default 5.0
)
returns table(id uuid, reference text, amount bigint) as $$
declare
  v_farmer_id uuid;
  v_total_captured bigint;
  v_platform_fee bigint;
  v_farmer_amount bigint;
  v_payout_ref text;
  v_payout_id uuid;
begin
  -- Get the farmer from the pool's listing
  select l.farmer_id
    into v_farmer_id
  from public.pools p
  join public.listings l on l.id = p.listing_id
  where p.id = pool_id_param;

  if v_farmer_id is null then
    raise exception 'Pool or listing not found' using errcode = '02000';
  end if;

  -- Calculate total captured amount from pool members (in kobo)
  select coalesce(sum(amount_pledged * 100), 0)::bigint
    into v_total_captured
  from public.pool_members
  where pool_id = pool_id_param
    and payment_status = 'captured';

  if v_total_captured <= 0 then
    -- No captured payments, nothing to payout
    return;
  end if;

  -- Calculate platform fee and farmer amount
  v_platform_fee := (v_total_captured * platform_fee_percent / 100)::bigint;
  v_farmer_amount := v_total_captured - v_platform_fee;

  -- Generate unique reference
  v_payout_ref := 'PAY-' || extract(epoch from now())::bigint::text || '-' || 
                  upper(substr(md5(random()::text), 1, 6));

  -- Check if payout already exists for this pool
  if exists (select 1 from public.payouts where pool_id = pool_id_param) then
    -- Return existing payout
    return query
    select p.id, p.reference, p.amount
    from public.payouts p
    where p.pool_id = pool_id_param
    limit 1;
    return;
  end if;

  -- Create payout record
  insert into public.payouts (
    pool_id,
    farmer_id,
    amount,
    platform_fee,
    status,
    reference
  ) values (
    pool_id_param,
    v_farmer_id,
    v_farmer_amount,
    v_platform_fee,
    'pending',
    v_payout_ref
  )
  returning payouts.id into v_payout_id;

  -- Return the created payout
  return query
  select v_payout_id, v_payout_ref, v_farmer_amount;
end;
$$ language plpgsql security definer set search_path = '';

-- ============================================================================
-- PART 7: GRANT EXECUTE PERMISSIONS
-- ============================================================================

grant execute on function public.increment_pool_quantity(uuid, int) to authenticated;
grant execute on function public.reserve_pool_membership(uuid, uuid, int, numeric, text) to authenticated;
grant execute on function public.get_farmer_available_balance(uuid) to authenticated;
grant execute on function public.auto_generate_payouts(uuid, numeric) to authenticated, service_role;

-- ============================================================================
-- PART 8: STORAGE BUCKET
-- ============================================================================

-- Storage: Create listing-images bucket
-- Note: Use Supabase Dashboard > Storage to create the bucket if this fails
-- The column names vary by Supabase version (public vs is_public)
DO $$
BEGIN
  -- Try inserting with 'public' column first (newer versions)
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('listing-images', 'listing-images', true)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_column THEN
    -- Fall back to creating via basic insert (bucket settings can be configured in dashboard)
    INSERT INTO storage.buckets (id, name)
    VALUES ('listing-images', 'listing-images')
    ON CONFLICT (id) DO NOTHING;
  END;
END $$;

-- Storage: RLS Policies for listing-images bucket
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'listing-images' );

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload" on storage.objects for insert with check ( bucket_id = 'listing-images' and auth.role() = 'authenticated' );

drop policy if exists "Users can update own images" on storage.objects;
create policy "Users can update own images" on storage.objects for update using ( bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Users can delete own images" on storage.objects;
create policy "Users can delete own images" on storage.objects for delete using ( bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Service role full access" on storage.objects;
create policy "Service role full access" on storage.objects for all using ( bucket_id = 'listing-images' and auth.role() = 'service_role' );

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
-- All tables, policies, functions, and storage are now configured.
-- You can verify by running: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
