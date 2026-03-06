import type { NextRequest } from 'next/server'

import {
  requireFarmer,
  isAuthError,
  apiSuccess,
  handleApiError,
  parsePaginationParams,
  buildSupabaseRange,
  parseEnumParam,
} from '@/lib/api'
import { KOBO_PER_NAIRA, PAYOUT_STATUS } from '@/lib/constants'

const VALID_PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const
const DEFAULT_FARMER_LIMIT = 10

/**
 * GET /api/farmer/payouts
 * Fetch farmer's payout records
 * Query params:
 *   - status: 'pending' | 'processing' | 'completed' | 'failed' (optional)
 *   - limit: number (default: 10)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Require farmer role
    const authResult = await requireFarmer()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    // Parse query params
    const url = new URL(request.url)
    const { limit, offset } = parsePaginationParams(url.searchParams, DEFAULT_FARMER_LIMIT)
    const status = parseEnumParam(url.searchParams, 'status', VALID_PAYOUT_STATUSES)

    // Build query
    let query = supabase
      .from('payouts')
      .select(
        `
        id,
        amount,
        reference,
        status,
        created_at,
        processed_at,
        failure_reason,
        metadata,
        pool:pools!auto (id, listing:listings!auto (name, unit)),
        listing:listings!auto (id, name, unit)
        `,
        { count: 'exact' }
      )
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })
      .range(...buildSupabaseRange(offset, limit))

    if (status) {
      query = query.eq('status', status)
    }

    const { data: payouts, count, error } = await query

    if (error) {
      return handleApiError(error, 'Failed to fetch payouts')
    }

    // Calculate summary stats for this farmer
    const { data: stats } = await supabase
      .from('payouts')
      .select('amount, status')
      .eq('farmer_id', user.id)

    const summary = buildFarmerPayoutSummary(stats)

    return apiSuccess({
      payouts: payouts || [],
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Build farmer payout summary from stats data
 */
function buildFarmerPayoutSummary(stats: { amount: number; status: string }[] | null) {
  const calculateTotal = (statusFilter?: string) => {
    const filtered = statusFilter
      ? stats?.filter((p) => p.status === statusFilter)
      : stats
    const totalKobo = filtered?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    return totalKobo / KOBO_PER_NAIRA
  }

  return {
    total_earned: calculateTotal(),
    total_pending: calculateTotal(PAYOUT_STATUS.PENDING),
    total_completed: calculateTotal(PAYOUT_STATUS.COMPLETED),
    total_failed: calculateTotal(PAYOUT_STATUS.FAILED),
  }
}
