/**
 * Pagination utilities for API routes
 * Provides consistent pagination handling across all endpoints
 */

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Parse pagination parameters from URL search params
 * Handles both page-based and offset-based pagination
 * 
 * @param searchParams - URL search params
 * @param defaultLimit - Default items per page (defaults to DEFAULT_PAGE_SIZE)
 * @param maxLimit - Maximum items per page (defaults to MAX_PAGE_SIZE)
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = DEFAULT_PAGE_SIZE,
  maxLimit = MAX_PAGE_SIZE
): PaginationParams {
  // Parse page (1-indexed)
  const pageParam = searchParams.get('page')
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  // Parse limit with max cap
  const limitParam = searchParams.get('limit')
  const requestedLimit = parseInt(limitParam || String(defaultLimit), 10) || defaultLimit
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit)

  // Calculate offset
  // Support explicit offset param for backward compatibility
  const offsetParam = searchParams.get('offset')
  const offset = offsetParam !== null 
    ? Math.max(0, parseInt(offsetParam, 10) || 0)
    : (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Build pagination metadata for response
 * 
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }
}

/**
 * Build Supabase range for pagination
 * Returns [from, to] for use with .range()
 */
export function buildSupabaseRange(offset: number, limit: number): [number, number] {
  return [offset, offset + limit - 1]
}

/**
 * Parse and validate an enum parameter from search params
 * Returns undefined if the value is not in the allowed values
 */
export function parseEnumParam<T extends string>(
  searchParams: URLSearchParams,
  paramName: string,
  allowedValues: readonly T[]
): T | undefined {
  const value = searchParams.get(paramName)
  if (value && allowedValues.includes(value as T)) {
    return value as T
  }
  return undefined
}

/**
 * Parse a boolean parameter from search params
 * Returns undefined if not present
 */
export function parseBooleanParam(
  searchParams: URLSearchParams,
  paramName: string
): boolean | undefined {
  const value = searchParams.get(paramName)
  if (value === null) return undefined
  return value === 'true' || value === '1'
}

/**
 * Parse an integer parameter from search params
 * Returns undefined if not present or invalid
 */
export function parseIntParam(
  searchParams: URLSearchParams,
  paramName: string
): number | undefined {
  const value = searchParams.get(paramName)
  if (value === null) return undefined
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? undefined : parsed
}
