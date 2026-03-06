'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface NetworkStatusResult {
  /** Whether the browser is currently online */
  isOnline: boolean
  /** Whether we're attempting to reconnect after being offline */
  isReconnecting: boolean
  /** Timestamp of when we went offline (null if online) */
  offlineSince: Date | null
  /** Force a connectivity check */
  checkConnection: () => Promise<boolean>
}

/**
 * Hook to monitor network connectivity status
 * Uses navigator.onLine + actual connectivity check for accuracy
 */
export function useNetworkStatus(): NetworkStatusResult {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Verify actual connectivity by fetching a small resource
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Use a tiny fetch to check real connectivity
      // HEAD request to our own origin with cache bust
      const response = await fetch(`/api/health?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store'
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    // Initial state from browser
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setOfflineSince(new Date())
    }

    const handleOnline = async () => {
      // Browser says we're online, verify with actual request
      setIsReconnecting(true)
      
      const actuallyOnline = await checkConnection()
      
      if (actuallyOnline) {
        setIsOnline(true)
        setOfflineSince(null)
        setIsReconnecting(false)
      } else {
        // Browser says online but we can't actually connect
        // Retry in 5 seconds
        reconnectTimeoutRef.current = setTimeout(handleOnline, 5000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOfflineSince(new Date())
      setIsReconnecting(false)
      
      // Clear any pending reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [checkConnection])

  return {
    isOnline,
    isReconnecting,
    offlineSince,
    checkConnection
  }
}
