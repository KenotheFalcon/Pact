/**
 * Admin Chargebacks API
 * GET /api/admin/chargebacks - List chargebacks
 * POST /api/admin/chargebacks - Create a new chargeback
 * PATCH /api/admin/chargebacks - Update a chargeback
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError, apiForbidden } from '@/lib/api/responses'
import { ChargebackService } from '@/services/chargeback.service'

const createSchema = z.object({
  orderId: z.string().uuid().optional(),
  poolMemberId: z.string().uuid().optional(),
  paymentReference: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().optional(),
  dueDate: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'open',
    'awaiting_response',
    'under_review',
    'resolved_won',
    'resolved_lost',
    'refunded',
  ]).optional(),
  evidence: z.record(z.unknown()).optional(),
  adminNotes: z.string().optional(),
  outcome: z.string().optional(),
})

/**
 * Verify admin access
 */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}

/**
 * List chargebacks
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return apiUnauthorized()
    if (!await verifyAdmin(supabase, user.id)) return apiForbidden('Admin access required')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const admin = createAdminClient()
    const chargebackService = new ChargebackService(admin)

    const { data: chargebacks, count } = await chargebackService.listChargebacks({
      status: status as 'open' | 'awaiting_response' | 'under_review' | 'resolved_won' | 'resolved_lost' | 'refunded' | undefined,
      limit,
      offset,
    })

    const stats = await chargebackService.getStats()

    return apiSuccess({
      chargebacks,
      total: count,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: count > offset + limit,
      },
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * Create a new chargeback
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return apiUnauthorized()
    if (!await verifyAdmin(supabase, user.id)) return apiForbidden('Admin access required')

    const body = await request.json()
    const result = createSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const admin = createAdminClient()
    const chargebackService = new ChargebackService(admin)

    const createResult = await chargebackService.createChargeback(
      {
        orderId: result.data.orderId,
        poolMemberId: result.data.poolMemberId,
        paymentReference: result.data.paymentReference,
        amount: result.data.amount,
        reason: result.data.reason,
        dueDate: result.data.dueDate,
      },
      user.id
    )

    if (!createResult.success) {
      return apiBadRequest(createResult.error || 'Failed to create chargeback')
    }

    return apiSuccess({
      chargeback: createResult.data,
      message: 'Chargeback created',
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * Update a chargeback
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return apiUnauthorized()
    if (!await verifyAdmin(supabase, user.id)) return apiForbidden('Admin access required')

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const admin = createAdminClient()
    const chargebackService = new ChargebackService(admin)

    const updateResult = await chargebackService.updateChargeback(result.data.id, {
      status: result.data.status,
      evidence: result.data.evidence,
      adminNotes: result.data.adminNotes,
      outcome: result.data.outcome,
    })

    if (!updateResult.success) {
      return apiBadRequest(updateResult.error || 'Failed to update chargeback')
    }

    return apiSuccess({
      chargeback: updateResult.data,
      message: 'Chargeback updated',
    })
  } catch {
    return apiInternalError()
  }
}
