'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SuccessCheckProps {
  /** Size of the checkmark (default: 20) */
  size?: number
  /** Color class (default: text-pact-green) */
  className?: string
  /** Stroke width (default: 2) */
  strokeWidth?: number
  /** Show the checkmark (triggers animation) */
  show?: boolean
}

/**
 * Animated SVG checkmark for form success states
 * Respects prefers-reduced-motion
 */
export function SuccessCheck({
  size = 20,
  className,
  strokeWidth = 2,
  show = true
}: SuccessCheckProps) {
  const prefersReducedMotion = useReducedMotion()

  if (!show) return null

  // Reduced motion: instant display
  if (prefersReducedMotion) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('text-pact-green', className)}
        aria-hidden="true"
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('text-pact-green', className)}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      aria-hidden="true"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
      />
    </motion.svg>
  )
}

/**
 * Circular success badge with checkmark (for larger success confirmations)
 */
export function SuccessCheckBadge({
  size = 48,
  className
}: {
  size?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const checkSize = size * 0.5

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-pact-green/10',
          className
        )}
        style={{ width: size, height: size }}
      >
        <SuccessCheck size={checkSize} />
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        'flex items-center justify-center rounded-full bg-pact-green/10',
        className
      )}
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <SuccessCheck size={checkSize} />
    </motion.div>
  )
}
