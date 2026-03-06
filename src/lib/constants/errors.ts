/**
 * Standardized error messages
 * Use these for consistent error responses across the API
 */

export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  SESSION_EXPIRED: 'Session expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password',

  // Authorization
  FARMERS_ONLY: 'Only farmers can access this resource',
  ADMINS_ONLY: 'Only admins can access this resource',
  BUYERS_ONLY: 'Only buyers can access this resource',

  // Resources
  NOT_FOUND: 'Resource not found',
  POOL_NOT_FOUND: 'Pool not found',
  LISTING_NOT_FOUND: 'Listing not found',
  ORDER_NOT_FOUND: 'Order not found',
  USER_NOT_FOUND: 'User not found',

  // Validation
  INVALID_REQUEST: 'Invalid request',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_AMOUNT: 'Invalid amount',

  // Payments
  PAYMENT_INIT_FAILED: 'Failed to initialize payment',
  PAYMENT_VERIFY_FAILED: 'Failed to verify payment',
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
  INSUFFICIENT_FUNDS: 'Insufficient funds',

  // Pools
  POOL_EXPIRED: 'This pool has expired',
  POOL_FULL: 'This pool is already full',
  POOL_LOCKED: 'This pool is locked for processing',
  ALREADY_JOINED: 'You have already joined this pool',

  // Server
  INTERNAL_SERVER: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database operation failed',

  // Rate Limiting
  RATE_LIMITED: 'Too many requests. Please try again later.',
} as const

// HTTP Status codes for reference
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const
