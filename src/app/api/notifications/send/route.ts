/**
 * Send Push Notification API
 * POST /api/notifications/send - Send push notification to user(s)
 * Admin or internal use only
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError, apiForbidden } from '@/lib/api/responses'
import { 
  sendPushNotification, 
  sendBulkPushNotifications,
  getNotificationPayload,
  isVapidConfigured,
} from '@/lib/notifications/push'
import type { NotificationType, PushSubscription } from '@/lib/notifications/push'

interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  user_id: string
}

const sendSchema = z.object({
  userId: z.string().uuid().optional(),
  userIds: z.array(z.string().uuid()).optional(),
  type: z.enum([
    'pool_joined',
    'pool_locked',
    'pool_completed',
    'payment_received',
    'payout_ready',
    'order_confirmed',
    'order_delivered',
  ]),
  data: z.record(z.unknown()).optional(),
  // Allow custom title/body override
  customTitle: z.string().optional(),
  customBody: z.string().optional(),
}).refine(
  (data) => data.userId || (data.userIds && data.userIds.length > 0),
  { message: 'Either userId or userIds must be provided' }
)

/**
 * Send push notification
 * Requires admin role or internal API key
 */
export async function POST(request: Request) {
  try {
    if (!isVapidConfigured()) {
      return apiBadRequest('Push notifications not configured')
    }

    // Check for internal API key first
    const apiKey = request.headers.get('x-api-key')
    const isInternalCall = apiKey === process.env.INTERNAL_API_KEY

    if (!isInternalCall) {
      // Check for admin role
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return apiUnauthorized()
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return apiForbidden('Admin access required')
      }
    }

    const body = await request.json()
    const result = sendSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const { userId, userIds, type, data = {}, customTitle, customBody } = result.data

    // Get notification payload
    const payload = getNotificationPayload(type as NotificationType, data)
    
    // Apply custom overrides if provided
    if (customTitle) payload.title = customTitle
    if (customBody) payload.body = customBody

    // Use admin client to fetch subscriptions
    const admin = createAdminClient()
    
    // Determine target user IDs
    const targetUserIds = userId ? [userId] : userIds!

    // Fetch subscriptions for target users
    const { data: subscriptions, error: subError } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', targetUserIds) as { data: PushSubscriptionRow[] | null; error: unknown }

    if (subError || !subscriptions || subscriptions.length === 0) {
      return apiSuccess({
        sent: 0,
        failed: 0,
        message: 'No subscriptions found for target users',
      })
    }

    // Format subscriptions for web-push
    const formattedSubs: PushSubscription[] = subscriptions.map((sub: PushSubscriptionRow) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }))

    // Send notifications
    const { sent, failed, expired } = await sendBulkPushNotifications(formattedSubs, payload)

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await (admin
        .from('push_subscriptions') as unknown as { delete: () => { in: (col: string, val: string[]) => Promise<unknown> } })
        .delete()
        .in('endpoint', expired)
    }

    return apiSuccess({
      sent,
      failed,
      expiredRemoved: expired.length,
      message: `Sent ${sent} notification(s)`,
    })
  } catch {
    return apiInternalError()
  }
}
