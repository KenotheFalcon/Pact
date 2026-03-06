/**
 * Dispute API
 * POST /api/disputes - Create a dispute (authenticated users)
 * GET /api/disputes - List user's disputes (authenticated users)
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiCreated, apiUnauthorized, apiBadRequest, apiInternalError } from '@/lib/api/responses'

import type { DisputeType, DisputePriority } from '@/types/supabase'

const createDisputeSchema = z.object({
  order_id: z.string().uuid().optional(),
  pool_id: z.string().uuid().optional(),
  type: z.enum(['order', 'payout', 'quality', 'delivery', 'other'] as const),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject must be under 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be under 2000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional().default('medium'),
}).refine(
  (data) => data.order_id || data.pool_id || data.type === 'other',
  { message: 'Please provide an order or pool reference, or select "Other" as the type' }
)

/**
 * Create a new dispute
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const body = await request.json()
    const result = createDisputeSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const { order_id, pool_id, type, subject, description, priority } = result.data

    // If order_id provided, verify the user owns the order
    if (order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, buyer_id')
        .eq('id', order_id)
        .single()

      if (!order) {
        return apiBadRequest('Order not found')
      }

      const isOwner = order.user_id === user.id || order.buyer_id === user.id
      if (!isOwner) {
        return apiBadRequest('You can only dispute your own orders')
      }
    }

    // Check for existing open dispute on the same order
    if (order_id) {
      const { data: existing } = await supabase
        .from('disputes')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('order_id', order_id)
        .in('status', ['open', 'under_review'])
        .limit(1)

      if (existing && existing.length > 0) {
        return apiBadRequest('You already have an open dispute for this order')
      }
    }

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        reporter_id: user.id,
        order_id: order_id ?? null,
        pool_id: pool_id ?? null,
        type: type as DisputeType,
        subject,
        description,
        priority: priority as DisputePriority,
        status: 'open',
        evidence_urls: [],
      })
      .select('id, subject, status, created_at')
      .single()

    if (error) {
      return apiInternalError()
    }

    return apiCreated({ dispute })
  } catch {
    return apiInternalError()
  }
}

/**
 * List the current user's disputes
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const { data: disputes, error } = await supabase
      .from('disputes')
      .select('id, order_id, pool_id, type, subject, status, priority, resolution, created_at, updated_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return apiInternalError()
    }

    return apiSuccess({ disputes: disputes ?? [] })
  } catch {
    return apiInternalError()
  }
}
