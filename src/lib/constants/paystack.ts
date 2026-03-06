/**
 * Paystack API constants
 */

export const PAYSTACK_API_BASE_URL = 'https://api.paystack.co'

export const PAYSTACK_ENDPOINTS = {
  INITIALIZE: '/transaction/initialize',
  VERIFY: '/transaction/verify',
  CHARGE_AUTHORIZATION: '/transaction/charge_authorization',
  TRANSACTION: '/transaction',
  REFUND: '/refund',
  TRANSFER: '/transfer',
  TRANSFER_RECIPIENT: '/transferrecipient',
  BANK_LIST: '/bank',
  RESOLVE_ACCOUNT: '/bank/resolve',
} as const

// Build full URLs
export const PAYSTACK_URLS = {
  INITIALIZE: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.INITIALIZE}`,
  VERIFY: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.VERIFY}`,
  CHARGE_AUTHORIZATION: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.CHARGE_AUTHORIZATION}`,
  TRANSACTION: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.TRANSACTION}`,
  REFUND: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.REFUND}`,
  TRANSFER: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.TRANSFER}`,
  TRANSFER_RECIPIENT: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.TRANSFER_RECIPIENT}`,
  BANK_LIST: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.BANK_LIST}`,
  RESOLVE_ACCOUNT: `${PAYSTACK_API_BASE_URL}${PAYSTACK_ENDPOINTS.RESOLVE_ACCOUNT}`,
} as const

// Currency
export const PAYSTACK_CURRENCY = 'NGN'

// Webhook events
export const PAYSTACK_EVENTS = {
  CHARGE_SUCCESS: 'charge.success',
  CHARGE_FAILED: 'charge.failed',
  TRANSFER_SUCCESS: 'transfer.success',
  TRANSFER_FAILED: 'transfer.failed',
  TRANSFER_REVERSED: 'transfer.reversed',
  REFUND_PROCESSED: 'refund.processed',
  REFUND_FAILED: 'refund.failed',
} as const

// Transfer reasons
export const TRANSFER_REASONS = {
  FARMER_PAYOUT: 'Farmer payout from PACT marketplace',
  REFUND: 'Customer refund',
} as const
