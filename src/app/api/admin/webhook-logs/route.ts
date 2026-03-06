/**
 * Admin Webhook Logs API
 * GET /api/admin/webhook-logs - List webhook logs with filtering
 * POST /api/admin/webhook-logs/replay - Replay a failed webhook
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError, apiForbidden } from '@/lib/api/responses'

const listSchema = z.object({
  status: z.enum(['pending', 'processed', 'failed', 'retrying']).optional(),
  eventType: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

/**
 * List webhook logs
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return apiForbidden('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const params = listSchema.parse({
      status: searchParams.get('status') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    })

    // Query webhook logs
    const admin = createAdminClient()

    let query = admin
      .from('webhook_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.eventType) {
      query = query.eq('event_type', params.eventType)
    }

    const { data: logs, count, error } = await query

    if (error) {
      return apiInternalError()
    }

    // Get unique event types for filtering
    const { data: eventTypes } = await admin
      .from('webhook_logs')
      .select('event_type')
      .limit(100)

    const uniqueEventTypes = Array.from(new Set((eventTypes || []).map((e) => e.event_type)))

    return apiSuccess({
      logs: logs || [],
      total: count || 0,
      eventTypes: uniqueEventTypes,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        hasMore: (count || 0) > params.offset + params.limit,
      },
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * Replay a failed webhook
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return apiForbidden('Admin access required')
    }

    const body = await request.json()
    const logId = body.logId

    if (!logId) {
      return apiBadRequest('logId is required')
    }

    // Query webhook log for replay
    const admin = createAdminClient()

    // Get the log entry
    const { data: log, error: logError } = await admin
      .from('webhook_logs')
      .select('*')
      .eq('id', logId)
      .single()

    if (logError || !log) {
      return apiBadRequest('Webhook log not found')
    }

    // Mark as retrying
    await admin
      .from('webhook_logs')
      .update({ 
        status: 'retrying',
        retry_count: (log.retry_count || 0) + 1,
      })
      .eq('id', logId)

    // Re-process the webhook by calling our own webhook endpoint
    // This is a simplified replay - in production you might want more sophisticated handling
    try {
      const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-paystack-signature': 'replay', // Mark as replay
          'x-webhook-replay': 'true',
          'x-replay-log-id': logId,
        },
        body: JSON.stringify(log.payload),
      })

      if (webhookResponse.ok) {
        await admin
          .from('webhook_logs')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', logId)

        return apiSuccess({ 
          replayed: true, 
          logId,
          message: 'Webhook replayed successfully',
        })
      } else {
        await admin
          .from('webhook_logs')
          .update({ 
            status: 'failed',
            error_message: `Replay failed with status ${webhookResponse.status}`,
          })
          .eq('id', logId)

        return apiBadRequest('Webhook replay failed')
      }
    } catch {
      await admin
        .from('webhook_logs')
        .update({ 
          status: 'failed',
          error_message: 'Replay request failed',
        })
        .eq('id', logId)

      return apiInternalError()
    }
  } catch {
    return apiInternalError()
  }
}
