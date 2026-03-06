// API endpoint for fetching listings with filters

import { NextRequest } from 'next/server';
import { getListings } from '@/lib/database';
import type { ListingFilters, ListingStatus } from '@/types/database';
import { apiSuccess, apiInternalError } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';

// Valid values for type-safe parsing
const VALID_LISTING_STATUSES: ListingStatus[] = ['available', 'pending', 'active', 'rejected', 'sold_out', 'expired', 'inactive'];
const VALID_SORT_BY = ['price', 'created_at', 'distance'] as const;
const VALID_SORT_ORDER = ['asc', 'desc'] as const;

function parseListingStatus(value: string | null): ListingStatus | undefined {
  if (!value) return undefined;
  return VALID_LISTING_STATUSES.includes(value as ListingStatus) ? (value as ListingStatus) : undefined;
}

function parseSortBy(value: string | null): 'price' | 'created_at' | 'distance' | undefined {
  if (!value) return undefined;
  return VALID_SORT_BY.includes(value as typeof VALID_SORT_BY[number]) ? (value as typeof VALID_SORT_BY[number]) : undefined;
}

function parseSortOrder(value: string | null): 'asc' | 'desc' | undefined {
  if (!value) return undefined;
  return VALID_SORT_ORDER.includes(value as typeof VALID_SORT_ORDER[number]) ? (value as typeof VALID_SORT_ORDER[number]) : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filters from query params with type-safe parsing
    const filters: ListingFilters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      latitude: searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined,
      longitude: searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      organic: searchParams.get('organic') ? searchParams.get('organic') === 'true' : undefined,
      status: parseListingStatus(searchParams.get('status')),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: parseSortBy(searchParams.get('sortBy')),
      sortOrder: parseSortOrder(searchParams.get('sortOrder')),
    };

    const result = await getListings(filters);

    return apiSuccess(result);
  } catch (error: unknown) {
    return apiInternalError(error instanceof Error ? error.message : 'Failed to fetch listings');
  }
}
