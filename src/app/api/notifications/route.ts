import type { NextRequest } from 'next/server'

import {
  requireAuth,
  isAuthError,
  apiSuccess,
  apiBadRequest,
  handleApiError,
  parsePaginationParams,
  buildSupabaseRange,
  buildPaginationMeta,
  parseBooleanParam,
} from '@/lib/api'

/**
 * GET /api/notifications
 * Fetch user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    const { searchParams } = new URL(request.url)
    const { page, limit, offset } = parsePaginationParams(searchParams)
    const unreadOnly = parseBooleanParam(searchParams, 'unread') ?? false

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(...buildSupabaseRange(offset, limit))

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      return handleApiError(error, 'Failed to fetch notifications')
    }

    return apiSuccess({
      data: notifications,
      pagination: buildPaginationMeta(count || 0, page, limit),
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch notifications')
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    const body = await request.json()
    const { notificationIds, markAll } = body

    if (markAll) {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        return handleApiError(error, 'Failed to mark all as read')
      }

      return apiSuccess({ message: 'All notifications marked as read' })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return apiBadRequest('Invalid notification IDs')
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('user_id', user.id)

    if (error) {
      return handleApiError(error, 'Failed to update notifications')
    }

    return apiSuccess({ message: 'Notifications marked as read' })
  } catch (error) {
    return handleApiError(error, 'Failed to update notifications')
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return apiBadRequest('Notification ID required')
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      return handleApiError(error, 'Failed to delete notification')
    }

    return apiSuccess({ message: 'Notification deleted' })
  } catch (error) {
    return handleApiError(error, 'Failed to delete notification')
  }
}
