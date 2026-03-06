/**
 * Centralized status color utilities
 * Provides consistent styling for status badges across the application
 */

// Base color classes for light and dark mode
export const STATUS_COLORS = {
  // Success states (completed, active, approved, available)
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  
  // Warning states (pending, processing, draft)
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  
  // Info states (in_progress, new, locked)
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  
  // Error states (cancelled, failed, rejected, expired)
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  
  // Neutral/default states
  neutral: 'bg-muted text-muted-foreground',
  
  // Orange for special states (refunded, shipped)
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  
  // Purple for special states (authorized, paid)
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
} as const

export type StatusColorKey = keyof typeof STATUS_COLORS

/**
 * Map of common status values to color keys
 * Covers pool, order, payment, payout, listing, and contact statuses
 */
const STATUS_TO_COLOR: Record<string, StatusColorKey> = {
  // Success states
  completed: 'success',
  active: 'success',
  approved: 'success',
  available: 'success',
  delivered: 'success',
  resolved: 'success',
  confirmed: 'success',
  
  // Warning states
  pending: 'warning',
  processing: 'warning',
  draft: 'warning',
  
  // Info states
  in_progress: 'info',
  new: 'info',
  locked: 'info',
  shipped: 'info',
  
  // Error states
  cancelled: 'error',
  failed: 'error',
  rejected: 'error',
  expired: 'error',
  sold_out: 'error',
  closed: 'error',
  spam: 'error',
  
  // Special states
  refunded: 'orange',
  authorized: 'purple',
  paid: 'purple',
  archived: 'neutral',
}

/**
 * Get Tailwind classes for a status value
 * @param status - The status string (case-insensitive)
 * @param fallback - Fallback color key if status not found (default: 'neutral')
 */
export function getStatusColor(
  status: string | undefined | null,
  fallback: StatusColorKey = 'neutral'
): string {
  if (!status) return STATUS_COLORS[fallback]
  
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const colorKey = STATUS_TO_COLOR[normalizedStatus] || fallback
  
  return STATUS_COLORS[colorKey]
}

/**
 * Get a shadcn/ui Badge variant for a status
 * @param status - The status string (case-insensitive)
 */
export function getStatusBadgeVariant(
  status: string | undefined | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!status) return 'secondary'
  
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const colorKey = STATUS_TO_COLOR[normalizedStatus]
  
  switch (colorKey) {
    case 'success':
    case 'purple':
      return 'default'
    case 'error':
      return 'destructive'
    case 'warning':
    case 'info':
    case 'orange':
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * Get color classes for a specific color key
 * Useful when you know the exact color you want
 */
export function getColorClasses(colorKey: StatusColorKey): string {
  return STATUS_COLORS[colorKey]
}

/**
 * Listing-specific status colors
 * Maps listing statuses to appropriate colors
 */
export function getListingStatusColor(status: string | undefined | null): string {
  return getStatusColor(status, 'neutral')
}

/**
 * Order-specific status colors
 */
export function getOrderStatusColor(status: string | undefined | null): string {
  return getStatusColor(status, 'warning')
}

/**
 * Payment-specific status colors
 */
export function getPaymentStatusColor(status: string | undefined | null): string {
  return getStatusColor(status, 'warning')
}

/**
 * Payout-specific status colors
 */
export function getPayoutStatusColor(status: string | undefined | null): string {
  return getStatusColor(status, 'warning')
}
