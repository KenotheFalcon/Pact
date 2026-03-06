/**
 * Status constants for database entities
 * Use these instead of hardcoded strings in queries
 */

export const POOL_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  AUTHORIZED: 'authorized',
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
} as const

export const LISTING_STATUS = {
  DRAFT: 'draft',
  AVAILABLE: 'available',
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived',
} as const

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const CONTACT_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const

export const TRANSACTION_TYPE = {
  SALE: 'sale',
  REFUND: 'refund',
  PAYOUT: 'payout',
  FEE: 'fee',
} as const

export const USER_ROLE = {
  BUYER: 'buyer',
  FARMER: 'farmer',
  ADMIN: 'admin',
} as const

// Type helpers
export type PoolStatus = (typeof POOL_STATUS)[keyof typeof POOL_STATUS]
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
export type ListingStatus = (typeof LISTING_STATUS)[keyof typeof LISTING_STATUS]
export type PayoutStatus = (typeof PAYOUT_STATUS)[keyof typeof PAYOUT_STATUS]
export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS]
export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE]
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]
