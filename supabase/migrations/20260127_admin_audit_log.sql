-- Migration: Admin audit logging and notifications policy
-- Created: 2026-01-27
-- Description: Adds admin_audit_log table for tracking admin actions and
--              adds admin SELECT policy for notifications table

-- ============================================
-- Admin Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                    -- e.g., 'update_user_role', 'suspend_user'
  target_type TEXT NOT NULL,               -- e.g., 'profile', 'listing', 'pool', 'dispute'
  target_id UUID,                          -- ID of affected resource (nullable for batch actions)
  old_value JSONB,                         -- Previous state (nullable for create actions)
  new_value JSONB,                         -- New state (nullable for delete actions)
  metadata JSONB,                          -- Additional context (e.g., reason, notes)
  ip_address INET,                         -- Request IP address
  user_agent TEXT,                         -- Request user agent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add helpful comment
COMMENT ON TABLE public.admin_audit_log IS 'Tracks all administrative actions for accountability and debugging';
COMMENT ON COLUMN public.admin_audit_log.action IS 'The type of action performed (e.g., update_user_role, suspend_user, delete_listing)';
COMMENT ON COLUMN public.admin_audit_log.target_type IS 'The type of resource affected (e.g., profile, listing, pool, dispute)';
COMMENT ON COLUMN public.admin_audit_log.old_value IS 'The previous state of the resource before the action';
COMMENT ON COLUMN public.admin_audit_log.new_value IS 'The new state of the resource after the action';

-- ============================================
-- Indexes for efficient querying
-- ============================================

-- Index for querying by admin
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id 
  ON public.admin_audit_log(admin_id);

-- Index for querying by target
CREATE INDEX IF NOT EXISTS idx_audit_log_target 
  ON public.admin_audit_log(target_type, target_id);

-- Index for time-based queries (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON public.admin_audit_log(created_at DESC);

-- Composite index for action type filtering with time
CREATE INDEX IF NOT EXISTS idx_audit_log_action_time 
  ON public.admin_audit_log(action, created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Only admins can insert audit logs (via application)
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- No one can update or delete audit logs (immutable for accountability)
-- DELETE and UPDATE policies are intentionally omitted

-- ============================================
-- Admin Notifications SELECT Policy
-- ============================================

-- Allow admins to view all notifications for debugging purposes
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- Grant permissions
-- ============================================

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT SELECT ON public.admin_audit_log TO service_role;
