import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  requireAdmin,
  isAuthError,
  apiSuccess,
  apiBadRequest,
  handleApiError,
  parsePaginationParams,
  buildSupabaseRange,
  parseEnumParam,
} from '@/lib/api'
import { CONTACT_STATUS, MAX_ADMIN_NOTES_LENGTH } from '@/lib/constants'

// Validation schemas
const VALID_CONTACT_STATUSES = ['pending', 'in_progress', 'resolved', 'closed'] as const

const PatchBodySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VALID_CONTACT_STATUSES).optional(),
  admin_notes: z.string().max(MAX_ADMIN_NOTES_LENGTH).optional(),
})

/**
 * Escape special PostgreSQL LIKE pattern characters
 */
function sanitizeSearchPattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}

/**
 * GET /api/admin/contact-submissions
 * Fetch all contact submissions for admin triage
 * Query params:
 *   - status: 'pending' | 'in_progress' | 'resolved' | 'closed' (optional)
 *   - search: search query (optional)
 *   - limit: number (default: 20)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireAdmin()
    if (isAuthError(authResult)) return authResult.error
    const { supabase } = authResult

    // Parse query params
    const url = new URL(request.url)
    const { limit, offset } = parsePaginationParams(url.searchParams)
    const status = parseEnumParam(url.searchParams, 'status', VALID_CONTACT_STATUSES)
    const search = url.searchParams.get('search')

    // Build query
    let query = supabase
      .from('contact_submissions')
      .select(
        `
        id,
        name,
        email,
        subject,
        message,
        status,
        admin_notes,
        resolved_by,
        resolved_at,
        created_at,
        updated_at,
        user:profiles!contact_submissions_user_id_fkey (id, display_name, avatar_url)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(...buildSupabaseRange(offset, limit))

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      const sanitized = sanitizeSearchPattern(search)
      query = query.or(`subject.ilike.%${sanitized}%,message.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    }

    const { data: submissions, count, error } = await query

    if (error) {
      return handleApiError(error, 'Failed to fetch submissions')
    }

    // Get status counts for stats
    const { data: stats } = await supabase
      .from('contact_submissions')
      .select('status')

    const statusCounts = buildStatusCounts(stats)

    return apiSuccess({
      submissions: submissions || [],
      stats: statusCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/admin/contact-submissions
 * Update a contact submission
 * Body:
 *   - id: string
 *   - status: string (optional)
 *   - admin_notes: string (optional)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireAdmin()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    const body = await request.json()

    // Validate request body with Zod
    const parseResult = PatchBodySchema.safeParse(body)
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0]?.message || 'Invalid request body')
    }

    const { id, status, admin_notes } = parseResult.data

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
      if (status === CONTACT_STATUS.RESOLVED) {
        updateData.resolved_by = user.id
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data: updated, error } = await supabase
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return handleApiError(error, 'Failed to update submission')
    }

    return apiSuccess({ submission: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Build status counts from submissions data
 */
function buildStatusCounts(stats: { status: string }[] | null) {
  return {
    new: stats?.filter((s) => s.status === CONTACT_STATUS.NEW).length || 0,
    in_progress: stats?.filter((s) => s.status === CONTACT_STATUS.IN_PROGRESS).length || 0,
    resolved: stats?.filter((s) => s.status === CONTACT_STATUS.RESOLVED).length || 0,
    spam: stats?.filter((s) => s.status === 'spam').length || 0,
  }
}
