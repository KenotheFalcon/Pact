-- Migration: Add payouts table, update reserve_pool_membership, add farmer orders policy
-- 20250107_pool_improvements.sql

-- ============================================================================
-- 1. CREATE PAYOUTS TABLE (if not exists)
-- ============================================================================
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

-- Enable RLS on payouts
alter table public.payouts enable row level security;

-- Farmers can view their own payouts
create policy "Farmers can view their own payouts."
  on payouts for select
  using ( (select auth.uid()) = farmer_id );

-- Admins can view all payouts
create policy "Admins can view all payouts."
  on payouts for select
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Admins can update payouts
create policy "Admins can update payouts."
  on payouts for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- System/service can insert payouts (via RPC with security definer)
create policy "System can insert payouts."
  on payouts for insert
  with check ( true );

-- Create indexes for payouts
create index if not exists idx_payouts_pool_id on public.payouts(pool_id);
create index if not exists idx_payouts_farmer_id on public.payouts(farmer_id);
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_payouts_created_at on public.payouts(created_at desc);

-- ============================================================================
-- 2. UPDATE reserve_pool_membership TO CHECK STATUS AND EXPIRY
-- ============================================================================
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

-- ============================================================================
-- 3. CREATE auto_generate_payouts RPC
-- ============================================================================
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
-- 4. ADD RLS POLICY FOR FARMERS TO VIEW ORDERS RELATED TO THEIR LISTINGS
-- ============================================================================
-- Drop existing policy if it exists (to allow re-running migration)
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

-- ============================================================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================================================
grant execute on function public.reserve_pool_membership(uuid, uuid, int, numeric, text) to authenticated;
grant execute on function public.auto_generate_payouts(uuid, numeric) to authenticated, service_role;
