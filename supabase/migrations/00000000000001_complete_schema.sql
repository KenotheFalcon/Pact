-- ============================================================================
-- PACT MARKETPLACE - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This is the authoritative schema aligned with PRD.md, Backend.md, AppFlow.md
-- 
-- Tables: profiles, listings, pools, pool_members, orders, pool_chat, 
--         notifications, contact_submissions, payouts
--
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 0: CLEAN SLATE (Drop existing objects)
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_pool_quantity_check ON public.pools;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_pool_quantity(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS public.reserve_pool_membership(uuid, uuid, int, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS public.join_pool(uuid, uuid, int) CASCADE;
DROP FUNCTION IF EXISTS public.process_pool_lock(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_orders_for_pool(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.deduct_pool_inventory(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_farmer_available_balance(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_payouts(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.check_pool_lock_status() CASCADE;
DROP FUNCTION IF EXISTS public.void_pool_pledges(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.expire_stale_pools() CASCADE;

-- Drop tables (order matters for foreign keys)
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.pool_chat CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.pool_members CASCADE;
DROP TABLE IF EXISTS public.pools CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================================================
-- PART 1: EXTENSIONS AND TYPES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum for type safety
CREATE TYPE public.app_role AS ENUM ('buyer', 'farmer', 'admin');

-- ============================================================================
-- PART 2: TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES: Extends Supabase Auth users
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('buyer', 'farmer', 'admin')) DEFAULT 'buyer' NOT NULL,
  display_name TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  bio TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- -----------------------------------------------------------------------------
-- LISTINGS: Farmer product listings
-- -----------------------------------------------------------------------------
CREATE TABLE public.listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit > 0),
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  min_pool_qty INTEGER DEFAULT 1 CHECK (min_pool_qty >= 1),
  images JSONB DEFAULT '[]'::jsonb,
  organic BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  city TEXT,
  country TEXT,
  harvest_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('available', 'sold_out', 'expired', 'inactive')) DEFAULT 'available' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_listings_farmer_id ON public.listings(farmer_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);

-- -----------------------------------------------------------------------------
-- POOLS: Group buying pools for listings
-- Pool lifecycle: active → locked → funded/completed OR cancelled/expired
-- -----------------------------------------------------------------------------
CREATE TABLE public.pools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  min_quantity INTEGER NOT NULL CHECK (min_quantity >= 1),
  current_quantity INTEGER DEFAULT 0 CHECK (current_quantity >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('active', 'locked', 'funded', 'completed', 'cancelled', 'expired')) DEFAULT 'active' NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_pools_listing_id ON public.pools(listing_id);
CREATE INDEX idx_pools_leader_id ON public.pools(leader_id);
CREATE INDEX idx_pools_status ON public.pools(status);
CREATE INDEX idx_pools_expires_at ON public.pools(expires_at);
CREATE INDEX idx_pools_created_at ON public.pools(created_at DESC);

-- -----------------------------------------------------------------------------
-- POOL_MEMBERS: Buyer pledges to pools
-- Payment lifecycle: pending → authorized → captured OR voided
-- -----------------------------------------------------------------------------
CREATE TABLE public.pool_members (
  pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity_pledged INTEGER NOT NULL CHECK (quantity_pledged > 0),
  amount_pledged NUMERIC NOT NULL CHECK (amount_pledged > 0),
  payment_status TEXT CHECK (payment_status IN ('pending', 'authorized', 'captured', 'voided')) DEFAULT 'pending' NOT NULL,
  payment_reference TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (pool_id, user_id)
);

CREATE INDEX idx_pool_members_user_id ON public.pool_members(user_id);
CREATE INDEX idx_pool_members_payment_status ON public.pool_members(payment_status);

-- -----------------------------------------------------------------------------
-- ORDERS: Created when pool locks, tracks fulfillment
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending' NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')) DEFAULT 'pending' NOT NULL,
  payment_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_pool_id ON public.orders(pool_id);
CREATE INDEX idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- -----------------------------------------------------------------------------
-- POOL_CHAT: Messages within a pool
-- -----------------------------------------------------------------------------
CREATE TABLE public.pool_chat (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_pool_chat_pool_id ON public.pool_chat(pool_id);
CREATE INDEX idx_pool_chat_created_at ON public.pool_chat(created_at DESC);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS: User notifications
-- -----------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- -----------------------------------------------------------------------------
-- CONTACT_SUBMISSIONS: Contact form submissions for admin triage
-- -----------------------------------------------------------------------------
CREATE TABLE public.contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_contact_submissions_user_id ON public.contact_submissions(user_id);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- -----------------------------------------------------------------------------
-- PAYOUTS: Farmer payout records after pool completion
-- -----------------------------------------------------------------------------
CREATE TABLE public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0), -- Amount in kobo
  platform_fee BIGINT DEFAULT 0 CHECK (platform_fee >= 0), -- Fee in kobo
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending' NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  transfer_code TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payouts_pool_id ON public.payouts(pool_id);
CREATE INDEX idx_payouts_farmer_id ON public.payouts(farmer_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_created_at ON public.payouts(created_at DESC);

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: RLS POLICIES
-- ============================================================================

-- === PROFILES ===
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === LISTINGS ===
CREATE POLICY "listings_select_public" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "listings_insert_farmer" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "listings_update_farmer" ON public.listings
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "listings_update_admin" ON public.listings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "listings_delete_admin" ON public.listings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === POOLS ===
CREATE POLICY "pools_select_public" ON public.pools
  FOR SELECT USING (true);

CREATE POLICY "pools_insert_auth" ON public.pools
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pools_update_admin" ON public.pools
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "pools_delete_admin" ON public.pools
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === POOL_MEMBERS ===
CREATE POLICY "pool_members_select_public" ON public.pool_members
  FOR SELECT USING (true);

CREATE POLICY "pool_members_insert_own" ON public.pool_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pool_members_update_own" ON public.pool_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pool_members_update_admin" ON public.pool_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === ORDERS ===
CREATE POLICY "orders_select_buyer" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "orders_select_farmer" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      JOIN public.listings l ON l.id = p.listing_id
      WHERE p.id = orders.pool_id AND l.farmer_id = auth.uid()
    )
  );

CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "orders_insert_system" ON public.orders
  FOR INSERT WITH CHECK (true); -- Inserted by RPCs with SECURITY DEFINER

CREATE POLICY "orders_update_buyer" ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === POOL_CHAT ===
CREATE POLICY "pool_chat_select_public" ON public.pool_chat
  FOR SELECT USING (true);

CREATE POLICY "pool_chat_insert_auth" ON public.pool_chat
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- === NOTIFICATIONS ===
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Inserted by system/RPCs

-- === CONTACT_SUBMISSIONS ===
CREATE POLICY "contact_submissions_select_own" ON public.contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contact_submissions_select_admin" ON public.contact_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "contact_submissions_insert_public" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_submissions_update_admin" ON public.contact_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "contact_submissions_delete_admin" ON public.contact_submissions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- === PAYOUTS ===
CREATE POLICY "payouts_select_farmer" ON public.payouts
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "payouts_select_admin" ON public.payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "payouts_insert_system" ON public.payouts
  FOR INSERT WITH CHECK (true); -- Inserted by RPCs

CREATE POLICY "payouts_update_admin" ON public.payouts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PART 5: FUNCTIONS (RPCs)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user: Trigger function for auth.users insert
-- Creates profile on signup, handles ghost profile cleanup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ghost_id UUID;
  user_role public.app_role;
BEGIN
  -- Find and delete ghost profile with same email but different ID
  SELECT id INTO ghost_id FROM public.profiles WHERE email = NEW.email AND id <> NEW.id;
  
  IF ghost_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = ghost_id;
  END IF;

  -- Determine role from metadata or default to buyer
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'buyer'::public.app_role
  );

  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, avatar_url, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_role::TEXT,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- increment_pool_quantity: Atomically increment pool current_quantity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_pool_quantity(
  pool_id_param UUID,
  quantity_param INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.pools
  SET 
    current_quantity = current_quantity + quantity_param,
    updated_at = NOW()
  WHERE id = pool_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- reserve_pool_membership: Atomic pool join with capacity/status/expiry checks
-- Called during payment initialization
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_pool_membership(
  pool_id_param UUID,
  user_id_param UUID,
  quantity_param INT,
  amount_naira NUMERIC,
  reference_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_pool_status TEXT;
  v_expires_at TIMESTAMPTZ;
  v_min_quantity INT;
  v_listing_quantity INT;
  v_max_quantity INT;
  v_committed INT;
BEGIN
  -- Validate quantity
  IF quantity_param IS NULL OR quantity_param <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = '22023';
  END IF;

  -- Lock pool row and get details
  SELECT p.status, p.expires_at, p.min_quantity, COALESCE(l.quantity, 0)
    INTO v_pool_status, v_expires_at, v_min_quantity, v_listing_quantity
  FROM public.pools p
  JOIN public.listings l ON l.id = p.listing_id
  WHERE p.id = pool_id_param
  FOR UPDATE;

  -- Validate pool exists
  IF v_min_quantity IS NULL THEN
    RAISE EXCEPTION 'Pool not found' USING ERRCODE = '02000';
  END IF;

  -- Validate pool is active
  IF v_pool_status <> 'active' THEN
    RAISE EXCEPTION 'Pool is not active (status: %)', v_pool_status USING ERRCODE = '45001';
  END IF;

  -- Validate pool not expired
  IF v_expires_at IS NOT NULL AND v_expires_at <= NOW() THEN
    RAISE EXCEPTION 'Pool has expired' USING ERRCODE = '45002';
  END IF;

  -- Calculate max capacity (listing quantity or min_quantity if no limit)
  v_max_quantity := GREATEST(v_listing_quantity, v_min_quantity);

  -- Sum committed quantities (pending counts against capacity)
  SELECT COALESCE(SUM(quantity_pledged), 0) INTO v_committed
  FROM public.pool_members
  WHERE pool_id = pool_id_param
    AND payment_status IN ('pending', 'authorized', 'captured');

  -- Check capacity
  IF v_committed + quantity_param > v_max_quantity THEN
    RAISE EXCEPTION 'Pool capacity exceeded' USING ERRCODE = '45000';
  END IF;

  -- Upsert pool member
  INSERT INTO public.pool_members (
    pool_id, user_id, quantity_pledged, amount_pledged, payment_status, payment_reference, joined_at
  ) VALUES (
    pool_id_param, user_id_param, quantity_param, amount_naira, 'pending', reference_param, NOW()
  )
  ON CONFLICT (pool_id, user_id) DO UPDATE SET
    quantity_pledged = EXCLUDED.quantity_pledged,
    amount_pledged = EXCLUDED.amount_pledged,
    payment_status = 'pending',
    payment_reference = EXCLUDED.payment_reference,
    joined_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- join_pool: Simple pool join (for PactService compatibility)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_pool(
  p_pool_id UUID,
  p_user_id UUID,
  p_quantity INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_price NUMERIC;
  v_amount NUMERIC;
  v_ref TEXT;
BEGIN
  -- Get price from listing
  SELECT l.price_per_unit INTO v_price
  FROM public.pools p
  JOIN public.listings l ON l.id = p.listing_id
  WHERE p.id = p_pool_id;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Pool or listing not found';
  END IF;

  v_amount := v_price * p_quantity;
  v_ref := 'JOIN-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);

  RETURN public.reserve_pool_membership(p_pool_id, p_user_id, p_quantity, v_amount, v_ref);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- process_pool_lock: Lock pool, capture payments, create orders, deduct inventory
-- Called when pool reaches min_quantity or by cron
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_pool_lock(pool_id_param UUID)
RETURNS VOID AS $$
DECLARE
  v_pool RECORD;
  v_member RECORD;
  v_listing_id UUID;
  v_total_quantity INT := 0;
BEGIN
  -- Get and lock pool
  SELECT p.*, l.id AS listing_id, l.farmer_id
    INTO v_pool
  FROM public.pools p
  JOIN public.listings l ON l.id = p.listing_id
  WHERE p.id = pool_id_param
  FOR UPDATE;

  IF v_pool IS NULL THEN
    RAISE EXCEPTION 'Pool not found';
  END IF;

  IF v_pool.status <> 'active' THEN
    RAISE EXCEPTION 'Pool is not active';
  END IF;

  IF v_pool.current_quantity < v_pool.min_quantity THEN
    RAISE EXCEPTION 'Pool has not reached minimum quantity';
  END IF;

  v_listing_id := v_pool.listing_id;

  -- Update pool status to locked
  UPDATE public.pools
  SET status = 'locked', updated_at = NOW()
  WHERE id = pool_id_param;

  -- Capture all authorized payments and create orders
  FOR v_member IN
    SELECT * FROM public.pool_members
    WHERE pool_id = pool_id_param AND payment_status = 'authorized'
  LOOP
    -- Update payment status to captured
    UPDATE public.pool_members
    SET payment_status = 'captured'
    WHERE pool_id = v_member.pool_id AND user_id = v_member.user_id;

    -- Create order
    INSERT INTO public.orders (
      buyer_id, pool_id, listing_id, quantity, amount, payment_status, status, payment_reference
    ) VALUES (
      v_member.user_id, pool_id_param, v_listing_id, v_member.quantity_pledged,
      v_member.amount_pledged, 'paid', 'confirmed', v_member.payment_reference
    );

    v_total_quantity := v_total_quantity + v_member.quantity_pledged;

    -- Notify buyer
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_member.user_id, 'pool_locked', 'Pool Locked',
      'Your pool order has been confirmed!',
      jsonb_build_object('pool_id', pool_id_param)
    );
  END LOOP;

  -- Deduct inventory from listing
  UPDATE public.listings
  SET quantity = GREATEST(0, quantity - v_total_quantity), updated_at = NOW()
  WHERE id = v_listing_id;

  -- Update pool to funded
  UPDATE public.pools
  SET status = 'funded', updated_at = NOW()
  WHERE id = pool_id_param;

  -- Notify farmer
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    v_pool.farmer_id, 'pool_funded', 'Pool Funded',
    'A pool for your listing has been funded with ' || v_total_quantity || ' units!',
    jsonb_build_object('pool_id', pool_id_param, 'quantity', v_total_quantity)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- create_orders_for_pool: Create orders for all captured pool members
-- Returns number of orders created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_orders_for_pool(pool_id_param UUID)
RETURNS INT AS $$
DECLARE
  v_listing_id UUID;
  v_count INT := 0;
  v_member RECORD;
BEGIN
  -- Get listing_id
  SELECT listing_id INTO v_listing_id FROM public.pools WHERE id = pool_id_param;

  FOR v_member IN
    SELECT * FROM public.pool_members
    WHERE pool_id = pool_id_param AND payment_status = 'captured'
  LOOP
    INSERT INTO public.orders (
      buyer_id, pool_id, listing_id, quantity, amount, payment_status, status, payment_reference
    ) VALUES (
      v_member.user_id, pool_id_param, v_listing_id, v_member.quantity_pledged,
      v_member.amount_pledged, 'paid', 'confirmed', v_member.payment_reference
    )
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- deduct_pool_inventory: Deduct total pledged quantity from listing
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_pool_inventory(pool_id_param UUID)
RETURNS VOID AS $$
DECLARE
  v_listing_id UUID;
  v_total INT;
BEGIN
  SELECT listing_id INTO v_listing_id FROM public.pools WHERE id = pool_id_param;

  SELECT COALESCE(SUM(quantity_pledged), 0) INTO v_total
  FROM public.pool_members
  WHERE pool_id = pool_id_param AND payment_status = 'captured';

  UPDATE public.listings
  SET quantity = GREATEST(0, quantity - v_total), updated_at = NOW()
  WHERE id = v_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- void_pool_pledges: Void all pending/authorized pledges (for pool cancellation)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_pool_pledges(pool_id_param UUID)
RETURNS VOID AS $$
DECLARE
  v_member RECORD;
BEGIN
  FOR v_member IN
    SELECT * FROM public.pool_members
    WHERE pool_id = pool_id_param AND payment_status IN ('pending', 'authorized')
  LOOP
    UPDATE public.pool_members
    SET payment_status = 'voided'
    WHERE pool_id = v_member.pool_id AND user_id = v_member.user_id;

    -- Notify member
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_member.user_id, 'pool_cancelled', 'Pool Cancelled',
      'The pool you joined has been cancelled. Your payment will be refunded.',
      jsonb_build_object('pool_id', pool_id_param)
    );
  END LOOP;

  -- Update pool status
  UPDATE public.pools
  SET status = 'cancelled', current_quantity = 0, updated_at = NOW()
  WHERE id = pool_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- expire_stale_pools: Mark expired pools and void pledges (for cron job)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_pools()
RETURNS INT AS $$
DECLARE
  v_pool RECORD;
  v_count INT := 0;
BEGIN
  FOR v_pool IN
    SELECT id FROM public.pools
    WHERE status = 'active' AND expires_at < NOW()
  LOOP
    UPDATE public.pools
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_pool.id;

    -- Void pledges
    PERFORM public.void_pool_pledges(v_pool.id);
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- get_farmer_available_balance: Sum of paid+confirmed orders for farmer
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_farmer_available_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(o.amount), 0) INTO v_balance
  FROM public.orders o
  JOIN public.pools p ON p.id = o.pool_id
  JOIN public.listings l ON l.id = p.listing_id
  WHERE l.farmer_id = p_user_id
    AND o.payment_status = 'paid'
    AND o.status IN ('confirmed', 'delivered');

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- auto_generate_payouts: Create payout record for completed pool
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_generate_payouts(
  pool_id_param UUID,
  platform_fee_percent NUMERIC DEFAULT 5.0
)
RETURNS TABLE(id UUID, reference TEXT, amount BIGINT) AS $$
DECLARE
  v_farmer_id UUID;
  v_total_captured BIGINT;
  v_platform_fee BIGINT;
  v_farmer_amount BIGINT;
  v_payout_ref TEXT;
  v_payout_id UUID;
BEGIN
  -- Get farmer from pool's listing
  SELECT l.farmer_id INTO v_farmer_id
  FROM public.pools p
  JOIN public.listings l ON l.id = p.listing_id
  WHERE p.id = pool_id_param;

  IF v_farmer_id IS NULL THEN
    RAISE EXCEPTION 'Pool or listing not found' USING ERRCODE = '02000';
  END IF;

  -- Calculate total captured (convert to kobo)
  SELECT COALESCE(SUM(amount_pledged * 100), 0)::BIGINT INTO v_total_captured
  FROM public.pool_members
  WHERE pool_id = pool_id_param AND payment_status = 'captured';

  IF v_total_captured <= 0 THEN
    RETURN; -- No payments to process
  END IF;

  -- Calculate fees
  v_platform_fee := (v_total_captured * platform_fee_percent / 100)::BIGINT;
  v_farmer_amount := v_total_captured - v_platform_fee;

  -- Generate reference
  v_payout_ref := 'PAY-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));

  -- Check existing payout
  IF EXISTS (SELECT 1 FROM public.payouts WHERE pool_id = pool_id_param) THEN
    RETURN QUERY
    SELECT py.id, py.reference, py.amount
    FROM public.payouts py
    WHERE py.pool_id = pool_id_param
    LIMIT 1;
    RETURN;
  END IF;

  -- Create payout
  INSERT INTO public.payouts (pool_id, farmer_id, amount, platform_fee, status, reference)
  VALUES (pool_id_param, v_farmer_id, v_farmer_amount, v_platform_fee, 'pending', v_payout_ref)
  RETURNING payouts.id INTO v_payout_id;

  RETURN QUERY SELECT v_payout_id, v_payout_ref, v_farmer_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================================
-- PART 6: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.increment_pool_quantity(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_pool_membership(UUID, UUID, INT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_pool(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_pool_lock(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_orders_for_pool(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_pool_inventory(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.void_pool_pledges(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_pools() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_farmer_available_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_generate_payouts(UUID, NUMERIC) TO authenticated, service_role;

-- ============================================================================
-- PART 7: STORAGE BUCKET
-- ============================================================================

-- Create bucket (basic insert, configure in dashboard)
INSERT INTO storage.buckets (id, name)
VALUES ('listing-images', 'listing-images')
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "listing_images_select" ON storage.objects;
CREATE POLICY "listing_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_insert" ON storage.objects;
CREATE POLICY "listing_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "listing_images_update" ON storage.objects;
CREATE POLICY "listing_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "listing_images_delete" ON storage.objects;
CREATE POLICY "listing_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Verify with: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Verify RPCs with: SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
