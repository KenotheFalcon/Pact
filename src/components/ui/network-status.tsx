'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface NetworkStatusProps {
  /** Additional CSS classes */
  className?: string
  /** Whether the banner can be dismissed */
  dismissible?: boolean
  /** Position of the banner */
  position?: 'top' | 'bottom'
}

/**
 * Banner that displays when network connectivity is lost
 * Automatically hides when connection is restored
 */
export function NetworkStatus({
  className,
  dismissible = true,
  position = 'top'
}: NetworkStatusProps) {
  const { isOnline, isReconnecting, checkConnection } = useNetworkStatus()
  const prefersReducedMotion = useReducedMotion()
  const [isDismissed, setIsDismissed] = useState(false)

  // Reset dismissed state when we go offline again
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false)
    }
  }, [isOnline])

  // Don't show if online or dismissed
  const shouldShow = !isOnline && !isDismissed

  const handleRetry = async () => {
    await checkConnection()
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          role="alert"
          aria-live="assertive"
          className={cn(
            'fixed left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-3',
            'bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-50',
            'shadow-lg',
            position === 'top' ? 'top-0' : 'bottom-0',
            position === 'bottom' && 'pb-safe', // Safe area for devices with home indicators
            className
          )}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Icon */}
          <WifiOff className="h-5 w-5 flex-shrink-0" aria-hidden="true" />

          {/* Message */}
          <span className="text-sm font-medium">
            {isReconnecting
              ? 'Reconnecting...'
              : "You're offline. Some features may be unavailable."}
          </span>

          {/* Retry button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isReconnecting}
            className="ml-2 min-h-11 px-3 text-amber-950 hover:bg-amber-600/20 dark:text-amber-50 dark:hover:bg-amber-500/20"
          >
            <RefreshCw
              className={cn('h-4 w-4', isReconnecting && 'animate-spin')}
              aria-hidden="true"
            />
            <span className="sr-only">Retry connection</span>
          </Button>

          {/* Dismiss button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="min-h-11 min-w-11 p-0 text-amber-950 hover:bg-amber-600/20 dark:text-amber-50 dark:hover:bg-amber-500/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Small inline network indicator (icon only)
 * Good for headers/navigation
 */
export function NetworkStatusIcon({ className }: { className?: string }) {
  const { isOnline, isReconnecting } = useNetworkStatus()
  const prefersReducedMotion = useReducedMotion()

  if (isOnline) return null

  return (
    <motion.div
      className={cn('text-amber-500 dark:text-amber-400', className)}
      initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      title={isReconnecting ? 'Reconnecting...' : 'Offline'}
    >
      {isReconnecting ? (
        <RefreshCw className="h-4 w-4 animate-spin" aria-label="Reconnecting" />
      ) : (
        <WifiOff className="h-4 w-4" aria-label="Offline" />
      )}
    </motion.div>
  )
}
