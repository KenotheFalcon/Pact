/**
 * Push Notification Service
 * Handles Web Push API notifications for pool status updates
 */

import webpush from 'web-push'

// VAPID keys should be generated once and stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@pact.ng'

// Configure web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export type NotificationType = 
  | 'pool_joined'
  | 'pool_locked'
  | 'pool_completed'
  | 'payment_received'
  | 'payout_ready'
  | 'order_confirmed'
  | 'order_delivered'

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: 'normal',
      }
    )
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    
    // Handle expired subscriptions (410 Gone)
    if (err.statusCode === 410) {
      return { success: false, error: 'subscription_expired' }
    }
    
    return { success: false, error: err.message || 'Failed to send notification' }
  }
}

/**
 * Send notification to multiple subscriptions
 */
export async function sendBulkPushNotifications(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  const expired: string[] = []
  let sent = 0
  let failed = 0

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++
    } else if (result.status === 'fulfilled' && result.value.error === 'subscription_expired') {
      expired.push(subscriptions[index].endpoint)
    } else {
      failed++
    }
  })

  return { sent, failed, expired }
}

/**
 * Get notification payload for specific event types
 */
export function getNotificationPayload(
  type: NotificationType,
  data: Record<string, unknown> = {}
): PushNotificationPayload {
  const basePayload = {
    icon: '/images/pact-icon-192.png',
    badge: '/images/pact-badge.png',
  }

  switch (type) {
    case 'pool_joined':
      return {
        ...basePayload,
        title: 'New Pool Member!',
        body: `Someone joined your pool "${data.poolName || 'Unknown'}"`,
        tag: `pool-${data.poolId}`,
        data: { type, poolId: data.poolId, url: `/buyer/pools/${data.poolId}` },
      }

    case 'pool_locked':
      return {
        ...basePayload,
        title: 'Pool Locked!',
        body: `The pool "${data.poolName || 'Unknown'}" has reached its minimum quantity and is now locked.`,
        tag: `pool-${data.poolId}`,
        data: { type, poolId: data.poolId, url: `/buyer/pools/${data.poolId}` },
        actions: [
          { action: 'view', title: 'View Pool' },
        ],
      }

    case 'pool_completed':
      return {
        ...basePayload,
        title: 'Pool Completed!',
        body: `Great news! The pool "${data.poolName || 'Unknown'}" has been completed.`,
        tag: `pool-${data.poolId}`,
        data: { type, poolId: data.poolId, url: `/buyer/orders` },
      }

    case 'payment_received':
      return {
        ...basePayload,
        title: 'Payment Received',
        body: `Your payment of ₦${data.amount?.toLocaleString() || '0'} has been received.`,
        tag: `payment-${data.reference}`,
        data: { type, reference: data.reference, url: '/buyer/orders' },
      }

    case 'payout_ready':
      return {
        ...basePayload,
        title: 'Payout Ready!',
        body: `You have ₦${data.amount?.toLocaleString() || '0'} ready for payout.`,
        tag: 'payout-ready',
        data: { type, url: '/farmer/payouts' },
        actions: [
          { action: 'view', title: 'View Payouts' },
        ],
      }

    case 'order_confirmed':
      return {
        ...basePayload,
        title: 'Order Confirmed',
        body: `Your order #${data.orderId?.toString().slice(-8) || ''} has been confirmed.`,
        tag: `order-${data.orderId}`,
        data: { type, orderId: data.orderId, url: `/buyer/orders/${data.orderId}` },
      }

    case 'order_delivered':
      return {
        ...basePayload,
        title: 'Order Delivered!',
        body: `Your order #${data.orderId?.toString().slice(-8) || ''} has been delivered.`,
        tag: `order-${data.orderId}`,
        data: { type, orderId: data.orderId, url: `/buyer/orders/${data.orderId}` },
      }

    default:
      return {
        ...basePayload,
        title: 'PACT Notification',
        body: 'You have a new notification.',
        data: { type },
      }
  }
}

/**
 * Check if VAPID is properly configured
 */
export function isVapidConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY
}
