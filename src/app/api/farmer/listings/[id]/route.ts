import type { NextRequest } from 'next/server'

import {
  requireFarmer,
  isAuthError,
  requireOwnership,
  apiSuccess,
  apiNotFound,
  handleApiError,
} from '@/lib/api'

/**
 * DELETE /api/farmer/listings/[id]
 * Delete a listing by ID
 * Only the listing's farmer can delete it
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require farmer role
    const authResult = await requireFarmer()
    if (isAuthError(authResult)) return authResult.error
    const { user, supabase } = authResult

    const { id } = params

    // Verify listing exists and get owner
    const { data: listing } = await supabase
      .from('listings')
      .select('farmer_id')
      .eq('id', id)
      .single()

    if (!listing) {
      return apiNotFound('Listing')
    }

    // Verify user owns this listing
    const ownershipError = requireOwnership(listing.farmer_id, user.id, 'listing')
    if (ownershipError) return ownershipError

    // Delete the listing
    const { error } = await supabase.from('listings').delete().eq('id', id)

    if (error) {
      return handleApiError(error, 'Failed to delete listing')
    }

    return apiSuccess({ message: 'Listing deleted successfully' })
  } catch (error) {
    return handleApiError(error, 'Failed to delete listing')
  }
}
