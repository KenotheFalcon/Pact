-- Migration: Add user suspension fields to profiles
-- Created: 2025-01-09
-- Purpose: Enable admin functionality to suspend user accounts

-- Add suspension columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index for quick lookups of suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended 
  ON profiles(is_suspended) 
  WHERE is_suspended = true;

-- Add comments for documentation
COMMENT ON COLUMN profiles.is_suspended IS 'Whether the user account is currently suspended';
COMMENT ON COLUMN profiles.suspended_at IS 'Timestamp when the account was suspended';
COMMENT ON COLUMN profiles.suspended_by IS 'UUID of the admin who suspended the account';
COMMENT ON COLUMN profiles.suspension_reason IS 'Reason provided by admin for the suspension';

-- RLS policy: Only admins can update suspension fields
-- Note: This assumes you have an is_admin() function or similar
-- If not, you may need to add appropriate RLS policies

-- Example policy (uncomment if needed):
-- CREATE POLICY "Admins can update suspension status"
--   ON profiles
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );
