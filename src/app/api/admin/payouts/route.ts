import type { NextRequest } from 'next/server'

import {
  requireAdmin,
  isAuthError,
  apiSuccess,
  handleApiError,
  parsePaginationParams,
  buildSupabaseRange,
  parseEnumParam,
} from '@/lib/api'
import { KOBO_PER_NAIRA, PAYOUT_STATUS } from '@/lib/constants'

const VALID_PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const

/**
 * GET /api/admin/payouts
 * Fetch all payouts for admin dashboard
 * Query params:
 *   - status: filter by status (optional)
 *   - farmer_id: filter by farmer (optional)
 *   - limit: number (default: 20)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireAdmin()
    if (isAuthError(authResult)) return authResult.error
    const { supabase } = authResult

    // Parse query params
    const url = new URL(request.url)
    const { limit, offset } = parsePaginationParams(url.searchParams)
    const status = parseEnumParam(url.searchParams, 'status', VALID_PAYOUT_STATUSES)
    const farmerId = url.searchParams.get('farmer_id')

    // Build query
    let query = supabase
      .from('payouts')
      .select(
        `
        id,
        farmer_id,
        farmer:profiles!payouts_farmer_id_fkey (id, display_name, email),
        amount,
        reference,
        status,
        transfer_code,
        recipient_code,
        created_at,
        processed_at,
        failure_reason,
        metadata,
        pool:pools!auto (id),
        listing:listings!auto (id, name, unit)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(...buildSupabaseRange(offset, limit))

    if (status) {
      query = query.eq('status', status)
    }

    if (farmerId) {
      query = query.eq('farmer_id', farmerId)
    }

    const { data: payouts, count, error } = await query

    if (error) {
      return handleApiError(error, 'Failed to fetch payouts')
    }

    // Calculate summary stats
    const { data: stats } = await supabase
      .from('payouts')
      .select('amount, status')

    const summary = buildPayoutSummary(stats)

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
 * Build payout summary statistics from raw stats data
 */
function buildPayoutSummary(stats: { amount: number; status: string }[] | null) {
  const calculateTotal = (statusFilter?: string) => {
    const filtered = statusFilter
      ? stats?.filter((p) => p.status === statusFilter)
      : stats
    return filtered?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  }

  const totalKobo = calculateTotal()
  const pendingKobo = calculateTotal(PAYOUT_STATUS.PENDING)
  const completedKobo = calculateTotal(PAYOUT_STATUS.COMPLETED)
  const failedKobo = calculateTotal(PAYOUT_STATUS.FAILED)

  return {
    total_payouts_kobo: totalKobo,
    total_payouts: totalKobo / KOBO_PER_NAIRA,
    pending_kobo: pendingKobo,
    pending: pendingKobo / KOBO_PER_NAIRA,
    completed_kobo: completedKobo,
    completed: completedKobo / KOBO_PER_NAIRA,
    failed_kobo: failedKobo,
    failed: failedKobo / KOBO_PER_NAIRA,
  }
}
