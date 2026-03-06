-- Migration: Optimize RLS Policies for Performance
-- Created: 2025-12-17
-- Description: Wrap auth.uid() calls in SELECT subqueries to prevent per-row re-evaluation
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

-- Drop and recreate policies with optimized auth function calls

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = id );

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( (SELECT auth.uid()) = id );

DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
CREATE POLICY "Admins can update any profile."
  ON public.profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- LISTINGS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Farmers can insert their own listings." ON public.listings;
CREATE POLICY "Farmers can insert their own listings."
  ON public.listings FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = farmer_id );

DROP POLICY IF EXISTS "Farmers can update their own listings." ON public.listings;
CREATE POLICY "Farmers can update their own listings."
  ON public.listings FOR UPDATE
  USING ( (SELECT auth.uid()) = farmer_id );

DROP POLICY IF EXISTS "Admins can update any listing." ON public.listings;
CREATE POLICY "Admins can update any listing."
  ON public.listings FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete any listing." ON public.listings;
CREATE POLICY "Admins can delete any listing."
  ON public.listings FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- POOLS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update any pool." ON public.pools;
CREATE POLICY "Admins can update any pool."
  ON public.pools FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete any pool." ON public.pools;
CREATE POLICY "Admins can delete any pool."
  ON public.pools FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own orders." ON public.orders;
CREATE POLICY "Users can view their own orders."
  ON public.orders FOR SELECT
  USING ( (SELECT auth.uid()) = buyer_id );

DROP POLICY IF EXISTS "Users can create orders." ON public.orders;
CREATE POLICY "Users can create orders."
  ON public.orders FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = buyer_id );

DROP POLICY IF EXISTS "Users can update their own orders." ON public.orders;
CREATE POLICY "Users can update their own orders."
  ON public.orders FOR UPDATE
  USING ( (SELECT auth.uid()) = buyer_id );

DROP POLICY IF EXISTS "Admins can view all orders." ON public.orders;
CREATE POLICY "Admins can view all orders."
  ON public.orders FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update any order." ON public.orders;
CREATE POLICY "Admins can update any order."
  ON public.orders FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- POOL_MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can join pools." ON public.pool_members;
CREATE POLICY "Users can join pools."
  ON public.pool_members FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can update their own pool membership." ON public.pool_members;
CREATE POLICY "Users can update their own pool membership."
  ON public.pool_members FOR UPDATE
  USING ( (SELECT auth.uid()) = user_id );

-- ============================================================================
-- POOL_CHAT TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can post to pool chat." ON public.pool_chat;
CREATE POLICY "Users can post to pool chat."
  ON public.pool_chat FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = user_id );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications."
  ON public.notifications FOR SELECT
  USING ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Users can mark their own notifications as read." ON public.notifications;
CREATE POLICY "Users can mark their own notifications as read."
  ON public.notifications FOR UPDATE
  USING ( (SELECT auth.uid()) = user_id );

-- ============================================================================
-- CONTACT_SUBMISSIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own contact submissions." ON public.contact_submissions;
DROP POLICY IF EXISTS "Users can view their own contact submissions" ON public.contact_submissions;
CREATE POLICY "Users can view their own contact submissions."
  ON public.contact_submissions FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT auth.uid()) IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update contact submissions." ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can update contact submissions."
  ON public.contact_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete contact submissions." ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can delete contact submissions."
  ON public.contact_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Add comment explaining the optimization
COMMENT ON TABLE public.profiles IS 'User profiles with optimized RLS policies using SELECT auth.uid() for better performance at scale';
