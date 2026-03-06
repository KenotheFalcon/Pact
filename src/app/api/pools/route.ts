import { NextRequest } from 'next/server';
import { getPools } from '@/lib/database';
import type { GroupBuyFilters, PoolStatus } from '@/types/database';
import { RecommendationService } from '@/services/recommendation.service';
import { apiSuccess, apiInternalError } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';

// Valid values for type-safe parsing
const VALID_POOL_STATUSES: PoolStatus[] = ['active', 'locked', 'funded', 'completed', 'cancelled', 'expired'];
const VALID_SORT_BY = ['expires_at', 'progress', 'created_at'] as const;
const VALID_SORT_ORDER = ['asc', 'desc'] as const;

function parsePoolStatus(value: string | null): PoolStatus | undefined {
  if (!value) return undefined;
  return VALID_POOL_STATUSES.includes(value as PoolStatus) ? (value as PoolStatus) : undefined;
}

function parseSortBy(value: string | null): 'expires_at' | 'progress' | 'created_at' | undefined {
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
    const filters: GroupBuyFilters = {
      status: parsePoolStatus(searchParams.get('status')),
      category: searchParams.get('category') || undefined,
      latitude: searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined,
      longitude: searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: parseSortBy(searchParams.get('sortBy')),
      sortOrder: parseSortOrder(searchParams.get('sortOrder')),
    };

    let result;

    // If location is provided, use RecommendationService
    if (filters.latitude && filters.longitude) {
      const pools = await RecommendationService.getRecommendedPools(
        filters.latitude,
        filters.longitude,
        filters.radius || 50
      );
      
      // Handle pagination manually for recommendations
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPools = pools.slice(startIndex, endIndex);
      
      result = {
        data: paginatedPools,
        total: pools.length,
        page,
        limit,
        hasMore: endIndex < pools.length
      };
    } else {
      // Otherwise use standard fetching
      result = await getPools(filters);
    }

    return apiSuccess(result);
  } catch (error: unknown) {
    return apiInternalError(error instanceof Error ? error.message : 'Failed to fetch pools');
  }
}
