-- Migration: Add admin privileges and missing profile fields
-- Created: 2025-12-17

-- Add missing profile fields if they don't exist
DO $$ 
BEGIN
    -- Add full_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;

    -- Add is_verified column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified boolean default false;
    END IF;

    -- Add created_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone default timezone('utc'::text, now()) not null;
    END IF;
END $$;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any listing." ON public.listings;
DROP POLICY IF EXISTS "Admins can delete any listing." ON public.listings;
DROP POLICY IF EXISTS "Admins can update any pool." ON public.pools;
DROP POLICY IF EXISTS "Admins can delete any pool." ON public.pools;
DROP POLICY IF EXISTS "Admins can view all orders." ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order." ON public.orders;

-- Create admin bypass policies for profiles
CREATE POLICY "Admins can update any profile."
  ON public.profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create admin bypass policies for listings
CREATE POLICY "Admins can update any listing."
  ON public.listings FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any listing."
  ON public.listings FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create admin bypass policies for pools
CREATE POLICY "Admins can update any pool."
  ON public.pools FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any pool."
  ON public.pools FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create admin bypass policies for orders
CREATE POLICY "Admins can view all orders."
  ON public.orders FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any order."
  ON public.orders FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Add helpful comment
COMMENT ON POLICY "Admins can update any profile." ON public.profiles IS 'Allows admin users to update any user profile for moderation purposes';
COMMENT ON POLICY "Admins can view all orders." ON public.orders IS 'Allows admin users to view all orders for platform management';
