'use client'

import { useState, useEffect, useCallback } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { Bell, BellOff, Loader2 } from 'lucide-react'

type SubscriptionState = 'loading' | 'unsupported' | 'not-configured' | 'denied' | 'unsubscribed' | 'subscribed'

/**
 * Convert a base64 URL-encoded string to a Uint8Array for VAPID applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * PushNotificationSetup
 *
 * Client component that handles requesting notification permissions,
 * subscribing the browser's PushManager, and sending the subscription
 * to the server.
 *
 * Place this in dashboard layouts or settings pages.
 */
export function PushNotificationSetup() {
  const [state, setState] = useState<SubscriptionState>('loading')
  const [processing, setProcessing] = useState(false)

  const checkSubscription = useCallback(async () => {
    // Feature detection
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    // Check if VAPID is configured server-side
    try {
      const res = await fetch('/api/notifications/subscribe')
      const json = await res.json()
      if (!json.success) {
        setState('not-configured')
        return
      }
    } catch {
      setState('not-configured')
      return
    }

    // Check current permission
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    // Check if already subscribed via service worker
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      setState(existing ? 'subscribed' : 'unsubscribed')
    } catch {
      setState('unsubscribed')
    }
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const subscribe = async () => {
    setProcessing(true)
    try {
      // 1. Get VAPID key from server
      const keyRes = await fetch('/api/notifications/subscribe')
      const keyJson = await keyRes.json()
      if (!keyJson.success || !keyJson.data?.vapidPublicKey) {
        toast.error('Push notifications are not configured')
        return
      }
      const vapidPublicKey = keyJson.data.vapidPublicKey

      // 2. Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'unsubscribed')
        if (permission === 'denied') {
          toast.error('Notification permission denied. You can re-enable in browser settings.')
        }
        return
      }

      // 3. Subscribe via PushManager
      const registration = await navigator.serviceWorker.ready
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      // 4. Send subscription to server
      const subJson = subscription.toJSON()
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      })

      const result = await res.json()
      if (result.success) {
        setState('subscribed')
        toast.success('Notifications enabled!')
      } else {
        toast.error('Failed to save subscription')
      }
    } catch {
      toast.error('Failed to enable notifications')
    } finally {
      setProcessing(false)
    }
  }

  const unsubscribe = async () => {
    setProcessing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        const endpoint = encodeURIComponent(subscription.endpoint)
        await fetch(`/api/notifications/subscribe?endpoint=${endpoint}`, {
          method: 'DELETE',
        })
      }
      setState('unsubscribed')
      toast.success('Notifications disabled')
    } catch {
      toast.error('Failed to disable notifications')
    } finally {
      setProcessing(false)
    }
  }

  // Don't render anything for unsupported / not-configured states
  if (state === 'loading' || state === 'unsupported' || state === 'not-configured') {
    return null
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-3">
        <BellOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Notifications are blocked. Enable them in your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-card">
      <div className="flex items-center gap-3">
        <Bell className={`h-4 w-4 shrink-0 ${state === 'subscribed' ? 'text-pact-green' : 'text-muted-foreground'}`} />
        <div>
          <p className="text-sm font-medium">
            {state === 'subscribed' ? 'Notifications enabled' : 'Enable notifications'}
          </p>
          <p className="text-xs text-muted-foreground">
            {state === 'subscribed'
              ? 'You will receive updates about your pools and orders'
              : 'Get notified about pool updates, payments, and orders'}
          </p>
        </div>
      </div>
      <Button
        variant={state === 'subscribed' ? 'outline' : 'default'}
        size="sm"
        onClick={state === 'subscribed' ? unsubscribe : subscribe}
        disabled={processing}
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === 'subscribed' ? (
          'Disable'
        ) : (
          'Enable'
        )}
      </Button>
    </div>
  )
}
