/**
 * Push Notification Subscription API
 * POST /api/notifications/subscribe - Subscribe to push notifications
 * DELETE /api/notifications/subscribe - Unsubscribe from push notifications
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError } from '@/lib/api/responses'
import { getPublicVapidKey, isVapidConfigured } from '@/lib/notifications/push'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

/**
 * Subscribe to push notifications
 */
export async function POST(request: Request) {
  try {
    if (!isVapidConfigured()) {
      return apiBadRequest('Push notifications not configured')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const body = await request.json()
    const result = subscribeSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const { endpoint, keys } = result.data

    // Upsert subscription (update if exists, insert if not)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: request.headers.get('user-agent') || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,endpoint',
        }
      )

    if (error) {
      return apiInternalError()
    }

    return apiSuccess({ 
      subscribed: true,
      message: 'Successfully subscribed to push notifications',
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      // Delete all subscriptions for user
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
    } else {
      // Delete specific subscription
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)
    }

    return apiSuccess({ 
      unsubscribed: true,
      message: 'Successfully unsubscribed from push notifications',
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export async function GET() {
  try {
    if (!isVapidConfigured()) {
      return apiBadRequest('Push notifications not configured')
    }

    return apiSuccess({
      vapidPublicKey: getPublicVapidKey(),
    })
  } catch {
    return apiInternalError()
  }
}
