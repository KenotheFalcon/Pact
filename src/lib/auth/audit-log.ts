/**
 * Admin Audit Logging Helper
 * Provides functions for logging admin actions to the admin_audit_log table
 */
import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Target types for audit logging
 */
export type AuditTargetType =
  | 'profile'
  | 'listing'
  | 'pool'
  | 'order'
  | 'dispute'
  | 'payout'
  | 'contact_submission'
  | 'notification'

/**
 * Admin action types for audit logging
 */
export type AdminAction =
  // User management
  | 'update_user_role'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'toggle_verification'
  // Listing management
  | 'approve_listing'
  | 'reject_listing'
  | 'delete_listing'
  // Pool management
  | 'cancel_pool'
  | 'release_funds'
  // Dispute management
  | 'resolve_dispute'
  | 'update_dispute_status'
  | 'add_dispute_note'
  // Payout management
  | 'update_payout_status'
  | 'process_all_payouts'
  // Contact submission management
  | 'update_contact_submission'
  | 'delete_contact_submission'

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  adminId: string
  action: AdminAction
  targetType: AuditTargetType
  targetId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Get client IP and user agent from request headers
 * Returns null values if headers are not available (e.g., in some server contexts)
 */
async function getRequestInfo(): Promise<{
  ipAddress: string | null
  userAgent: string | null
}> {
  try {
    const headersList = await headers()
    
    // Try multiple headers for IP address (handles proxies)
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare
      null

    const userAgent = headersList.get('user-agent') || null

    return { ipAddress, userAgent }
  } catch {
    // Headers may not be available in all contexts
    return { ipAddress: null, userAgent: null }
  }
}

/**
 * Log an admin action to the audit log
 * 
 * @param supabase - Supabase client instance
 * @param entry - Audit log entry details
 * @returns Promise that resolves when logging is complete
 * 
 * @example
 * ```typescript
 * await logAdminAction(supabase, {
 *   adminId: userId,
 *   action: 'update_user_role',
 *   targetType: 'profile',
 *   targetId: targetUserId,
 *   oldValue: { role: 'buyer' },
 *   newValue: { role: 'farmer' },
 * })
 * ```
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  const { ipAddress, userAgent } = await getRequestInfo()

  // Fire and forget - don't block the action if logging fails
  // But we still await to ensure it's initiated
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: entry.adminId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId || null,
      old_value: entry.oldValue || null,
      new_value: entry.newValue || null,
      metadata: entry.metadata || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
  } catch {
    // Silently fail - we don't want logging failures to break admin actions
    // In production, this would ideally go to an external logging service
  }
}

/**
 * Create a simple audit log entry for actions without state changes
 * 
 * @param supabase - Supabase client instance
 * @param adminId - ID of the admin performing the action
 * @param action - The action being performed
 * @param targetType - The type of resource being affected
 * @param targetId - The ID of the resource being affected
 * @param metadata - Optional additional context
 */
export async function logSimpleAction(
  supabase: SupabaseClient,
  adminId: string,
  action: AdminAction,
  targetType: AuditTargetType,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAdminAction(supabase, {
    adminId,
    action,
    targetType,
    targetId,
    metadata,
  })
}

/**
 * Create an audit log entry for state change actions
 * 
 * @param supabase - Supabase client instance
 * @param adminId - ID of the admin performing the action
 * @param action - The action being performed
 * @param targetType - The type of resource being affected
 * @param targetId - The ID of the resource being affected
 * @param oldValue - The previous state
 * @param newValue - The new state
 * @param metadata - Optional additional context
 */
export async function logStateChange(
  supabase: SupabaseClient,
  adminId: string,
  action: AdminAction,
  targetType: AuditTargetType,
  targetId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAdminAction(supabase, {
    adminId,
    action,
    targetType,
    targetId,
    oldValue,
    newValue,
    metadata,
  })
}
