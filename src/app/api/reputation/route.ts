/**
 * Reputation API
 * GET /api/reputation?userId=<id> - Get user reputation
 * POST /api/reputation/recalculate - Recalculate reputation (admin only)
 */

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError } from '@/lib/api/responses'

export interface ReputationData {
  userId: string
  displayName: string | null
  reputationScore: number
  badge: 'new' | 'verified' | 'trusted' | 'premium'
  completedOrders: number
  successfulPools: number
  rating: number | null
  isVerified: boolean
}

/**
 * Get reputation for a user
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return apiBadRequest('userId parameter is required')
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        reputation_score,
        badge,
        completed_orders,
        successful_pools,
        rating,
        is_verified
      `)
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return apiBadRequest('User not found')
    }

    const reputation: ReputationData = {
      userId: profile.id,
      displayName: profile.display_name,
      reputationScore: profile.reputation_score || 0,
      badge: profile.badge || 'new',
      completedOrders: profile.completed_orders || 0,
      successfulPools: profile.successful_pools || 0,
      rating: profile.rating,
      isVerified: profile.is_verified || false,
    }

    return apiSuccess({ reputation })
  } catch {
    return apiInternalError()
  }
}

/**
 * Recalculate reputation for a user (triggered after events)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const body = await request.json()
    const targetUserId = body.userId || user.id

    // Only admins can recalculate other users' reputation
    if (targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return apiUnauthorized('Admin access required')
      }
    }

    // Call the RPC to recalculate reputation
    const { data: newScore, error } = await supabase
      .rpc('calculate_reputation_score', { p_user_id: targetUserId })

    if (error) {
      return apiInternalError()
    }

    // Fetch updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('reputation_score, badge')
      .eq('id', targetUserId)
      .single()

    return apiSuccess({
      userId: targetUserId,
      newScore: newScore || updatedProfile?.reputation_score || 0,
      badge: updatedProfile?.badge || 'new',
      message: 'Reputation recalculated',
    })
  } catch {
    return apiInternalError()
  }
}
