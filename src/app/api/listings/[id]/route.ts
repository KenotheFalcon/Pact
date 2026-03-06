/**
 * API endpoint for individual listing operations
 * GET /api/listings/[id] - Fetch listing details
 * PUT /api/listings/[id] - Update listing (farmer only)
 * DELETE /api/listings/[id] - Delete listing (farmer only)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getListing } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, requireOwnership } from '@/lib/api/auth-guards';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  getErrorMessage,
} from '@/lib/api/responses';

// Validation schema for listing updates
const ListingUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price_per_unit: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().min(1).max(50).optional(),
  min_pool_size: z.number().int().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  image_url: z.string().url().optional().nullable(),
  status: z.enum(['available', 'sold_out', 'expired', 'inactive']).optional(),
  harvest_date: z.string().datetime().optional().nullable(),
  expiry_date: z.string().datetime().optional().nullable(),
}).strict();

/**
 * GET - Fetch listing details (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await getListing(params.id);
    return apiSuccess(listing);
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to fetch listing');
    if (message.includes('not found')) {
      return apiNotFound('Listing');
    }
    return apiInternalError(message);
  }
}

/**
 * PUT - Update listing (authenticated farmer only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;
    const { user, supabase } = authResult;

    // Validate request body
    const body = await request.json();
    const parseResult = ListingUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0]?.message || 'Invalid request body');
    }

    // Verify ownership
    const listing = await getListing(params.id);
    const ownershipError = requireOwnership(listing.farmer_id, user.id, 'listing');
    if (ownershipError) return ownershipError;

    // Update listing
    const { data, error } = await supabase
      .from('listings')
      .update(parseResult.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(data);
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, 'Failed to update listing'));
  }
}

/**
 * DELETE - Remove listing (authenticated farmer only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;
    const { user, supabase } = authResult;

    // Verify ownership
    const listing = await getListing(params.id);
    const ownershipError = requireOwnership(listing.farmer_id, user.id, 'listing');
    if (ownershipError) return ownershipError;

    // Delete listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', params.id);

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess({ message: 'Listing deleted successfully' });
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, 'Failed to delete listing'));
  }
}
