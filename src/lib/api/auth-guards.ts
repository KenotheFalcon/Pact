/**
 * Authentication and authorization guards for API routes
 * Provides consistent auth checking across all API endpoints
 */

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { apiUnauthorized, apiForbidden } from './responses'

import type { SupabaseClient, User } from '@supabase/supabase-js'

export type UserRole = 'buyer' | 'farmer' | 'admin'

export interface AuthResult {
  user: User
  supabase: SupabaseClient
}

export interface AuthError {
  error: NextResponse
}

export type AuthCheckResult = AuthResult | AuthError

/**
 * Check if auth result is an error
 */
export function isAuthError(result: AuthCheckResult): result is AuthError {
  return 'error' in result
}

/**
 * Require authentication - returns user and supabase client or error response
 * 
 * Usage:
 * ```ts
 * const authResult = await requireAuth()
 * if (isAuthError(authResult)) return authResult.error
 * const { user, supabase } = authResult
 * ```
 */
export async function requireAuth(): Promise<AuthCheckResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: apiUnauthorized() }
  }

  return { user, supabase }
}

/**
 * Get user's role from the profiles table
 */
async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role as UserRole | null
}

/**
 * Require a specific role - returns user, supabase, and role or error response
 * 
 * Usage:
 * ```ts
 * const authResult = await requireRole('farmer')
 * if (isAuthError(authResult)) return authResult.error
 * const { user, supabase } = authResult
 * ```
 */
export async function requireRole(
  requiredRole: UserRole,
  roleLabel?: string
): Promise<AuthCheckResult> {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) {
    return authResult
  }

  const { user, supabase } = authResult
  const role = await getUserRole(supabase, user.id)

  if (role !== requiredRole) {
    const label = roleLabel || `${requiredRole}s`
    return { error: apiForbidden(`Only ${label} can access this resource`) }
  }

  return { user, supabase }
}

/**
 * Require farmer role
 */
export async function requireFarmer(): Promise<AuthCheckResult> {
  return requireRole('farmer', 'farmers')
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthCheckResult> {
  return requireRole('admin', 'administrators')
}

/**
 * Require buyer role
 */
export async function requireBuyer(): Promise<AuthCheckResult> {
  return requireRole('buyer', 'buyers')
}

/**
 * Check if user owns a resource
 * Returns error response if user doesn't own the resource
 */
export function requireOwnership(
  resourceOwnerId: string,
  userId: string,
  resourceName = 'resource'
): NextResponse | null {
  if (resourceOwnerId !== userId) {
    return apiForbidden(`You do not have permission to access this ${resourceName}`)
  }
  return null
}
