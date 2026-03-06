/**
 * Standardized API response helpers
 * Provides consistent response format across all API routes
 */

import { NextResponse } from 'next/server'

import { HTTP_STATUS } from '@/lib/constants'

// ===== SUCCESS RESPONSES =====

/**
 * Return a successful JSON response with data
 */
export function apiSuccess<T>(data: T, status = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Return a successful JSON response for created resources
 */
export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: HTTP_STATUS.CREATED })
}

/**
 * Return a successful response with no content
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT })
}

// ===== ERROR RESPONSES =====

/**
 * Return a generic error response
 */
export function apiError(message: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}

/**
 * Return a 400 Bad Request error
 */
export function apiBadRequest(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: HTTP_STATUS.BAD_REQUEST })
}

/**
 * Return a 401 Unauthorized error
 */
export function apiUnauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: HTTP_STATUS.UNAUTHORIZED })
}

/**
 * Return a 403 Forbidden error
 */
export function apiForbidden(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: HTTP_STATUS.FORBIDDEN })
}

/**
 * Return a 404 Not Found error
 */
export function apiNotFound(resource = 'Resource'): NextResponse {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: HTTP_STATUS.NOT_FOUND }
  )
}

/**
 * Return a 409 Conflict error
 */
export function apiConflict(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: HTTP_STATUS.CONFLICT })
}

/**
 * Return a 500 Internal Server Error
 */
export function apiInternalError(message = 'Internal server error'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

// ===== UTILITY FUNCTIONS =====

/**
 * Extract error message from unknown error type
 * Safely handles Error objects and unknown types
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

/**
 * Handle caught errors and return appropriate API response
 * Use this in catch blocks for consistent error handling
 */
export function handleApiError(error: unknown, fallbackMessage = 'An unexpected error occurred'): NextResponse {
  const message = getErrorMessage(error, fallbackMessage)
  return apiInternalError(message)
}
