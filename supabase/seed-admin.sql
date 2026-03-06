-- ============================================
-- PACT Marketplace - Admin User Seed Script
-- ============================================
-- 
-- This script promotes an existing user to admin role.
-- 
-- USAGE:
-- 1. First, create a regular user account via the signup form
-- 2. Get the user's UUID from Supabase Auth dashboard or profiles table
-- 3. Replace 'YOUR_USER_UUID_HERE' with the actual UUID
-- 4. Run this script in Supabase SQL Editor
--
-- IMPORTANT: 
-- - This script should only be run once per admin user
-- - Keep this script secure and do not expose in public repositories
-- - Consider using Supabase CLI for local development: supabase db seed
--
-- ============================================

-- Replace this UUID with the user you want to promote to admin
-- You can find user UUIDs in:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. Or query: SELECT id, email FROM profiles;

DO $$
DECLARE
    target_user_id UUID := 'YOUR_USER_UUID_HERE';  -- REPLACE THIS
    user_exists BOOLEAN;
BEGIN
    -- Check if the user exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = target_user_id
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with ID % does not exist. Please create an account first via the signup form.', target_user_id;
    END IF;

    -- Update the user's role to admin
    UPDATE public.profiles
    SET 
        role = 'admin',
        is_verified = true,
        updated_at = now()
    WHERE id = target_user_id;

    RAISE NOTICE 'Successfully promoted user % to admin role.', target_user_id;
END $$;

-- ============================================
-- ALTERNATIVE: Promote by Email Address
-- ============================================
-- Uncomment and use this section if you prefer to promote by email

/*
DO $$
DECLARE
    target_email TEXT := 'admin@example.com';  -- REPLACE THIS
    target_user_id UUID;
BEGIN
    -- Get user ID by email
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist. Please create an account first via the signup form.', target_email;
    END IF;

    -- Update the user's role to admin
    UPDATE public.profiles
    SET 
        role = 'admin',
        is_verified = true,
        updated_at = now()
    WHERE id = target_user_id;

    RAISE NOTICE 'Successfully promoted user % (%) to admin role.', target_email, target_user_id;
END $$;
*/

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify admin users after promotion

-- SELECT id, email, role, is_verified, created_at 
-- FROM public.profiles 
-- WHERE role = 'admin';
