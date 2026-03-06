import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { AnimatedPoolCard } from '@/components/marketplace/AnimatedPoolCard';
import { PoolsGridSkeleton } from '@/components/marketplace/PoolSkeletons';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { EmptyState } from '@/components/marketplace/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';
import type { Pool, PoolFilters } from '@/types/database';
import { getPools } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';
import { RecommendationService } from '@/services/recommendation.service';

// Dynamically import PoolMap to avoid SSR issues with Leaflet
const PoolMap = dynamic(() => import('@/components/marketplace/PoolMap'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground">Loading Map...</div>
});

// Client-side interactive wrapper for filters and view mode
import { MarketplaceInteractive } from '@/components/marketplace/MarketplaceInteractive';

/**
 * Server-side data fetching for marketplace pools
 * Uses Supabase RPC for optimal performance
 */
async function getPoolsServerSide(filters?: PoolFilters) {
    try {
        const supabase = await createClient();
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const offset = (page - 1) * limit;

        const { data, error } = await supabase.rpc('list_pools_with_filters', {
            p_category: filters?.category ?? null,
            p_latitude: filters?.latitude ?? null,
            p_longitude: filters?.longitude ?? null,
            p_radius_km: filters?.radius ?? null,
            p_sort_by: filters?.sortBy ?? 'created_at',
            p_sort_order: filters?.sortOrder ?? 'desc',
            p_limit: limit,
            p_offset: offset,
        });

if (!error && Array.isArray(data)) {
            const normalized: Pool[] = data.map((row) => ({
                id: row.id,
                listing_id: row.listing_id,
                leader_id: row.leader_id ?? '',
                min_quantity: row.min_quantity,
                current_quantity: row.current_quantity,
                expires_at: row.expires_at,
                status: row.status,
                latitude: row.latitude,
                longitude: row.longitude,
                created_at: row.created_at ?? new Date().toISOString(),
                updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
                listing: {
                    id: row.listing_id,
                    farmer_id: row.farmer_id ?? '',
                    name: row.name,
                    description: row.description ?? '',
                    category: row.category,
                    unit: row.unit,
                    quantity: row.quantity ?? row.min_quantity ?? 0,
                    min_quantity: row.min_quantity ?? 0,
                    price_per_unit: typeof row.price_per_unit === 'string' ? parseFloat(row.price_per_unit) : row.price_per_unit,
                    images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
                    latitude: row.latitude ?? 0,
                    longitude: row.longitude ?? 0,
                    address: row.address ?? '',
                    city: row.city ?? undefined,
                    country: row.country ?? undefined,
                    harvest_date: row.harvest_date ?? undefined,
                    expiry_date: row.expiry_date ?? row.expires_at ?? undefined,
                    organic: !!row.organic,
                    status: row.listing_status ?? 'available',
                    created_at: row.listing_created_at ?? row.created_at ?? new Date().toISOString(),
                    updated_at: row.listing_updated_at ?? row.updated_at ?? row.listing_created_at ?? new Date().toISOString(),
                },
                distance: row.distance_km ?? undefined,
                leader: undefined,
                members: [],
            }));

            const totalCount = data.length > 0 && typeof data[0].total_count === 'number' ? data[0].total_count : (page - 1) * limit + (normalized.length ?? 0);
            return {
                data: normalized,
                total: totalCount,
                page,
                limit,
                hasMore: page * limit < totalCount,
            };
        }
        // RPC call failed or returned empty - return empty result
        return {
            data: [],
            total: 0,
            page: 1,
            limit: 50,
            hasMore: false
        };
    } catch {
        // Return empty result on error
        return {
            data: [],
            total: 0,
            page: 1,
            limit: 50,
            hasMore: false
        };
    }
}

/**
 * Grid view with lazy loading for individual cards
 */
async function PoolsGridView({ 
    pools, 
}: { 
    pools: Pool[]; 
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{ contentVisibility: 'auto' }}>
            {pools.map((pool, index) => (
<AnimatedPoolCard key={pool.id} pool={pool} index={index} />
            ))}
        </div>
    );
}



export const metadata = {
    title: 'Marketplace | Pact',
    description: 'Browse active pools for fresh produce',
};

// ISR: Revalidate every 3 minutes for fresh pool data
export const revalidate = 180;
// Allow dynamic rendering for search params
export const dynamicParams = true;

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // Parse search params into filter object
    const sortByParam = searchParams.sortBy ? String(searchParams.sortBy) : undefined;
    const allowedSortBy: PoolFilters['sortBy'][] = ['expires_at', 'progress', 'created_at'];
    const sortBy = allowedSortBy.includes(sortByParam as PoolFilters['sortBy']) ? (sortByParam as PoolFilters['sortBy']) : 'created_at';

    const sortOrderParam = searchParams.sortOrder ? String(searchParams.sortOrder) : undefined;
    const sortOrder: PoolFilters['sortOrder'] = sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : 'desc';

    const filters: PoolFilters = {
        category: searchParams.category ? String(searchParams.category) : undefined,
        latitude: searchParams.latitude ? parseFloat(String(searchParams.latitude)) : undefined,
        longitude: searchParams.longitude ? parseFloat(String(searchParams.longitude)) : undefined,
        radius: searchParams.radius ? parseFloat(String(searchParams.radius)) : undefined,
        page: searchParams.page ? parseInt(String(searchParams.page)) : 1,
        limit: 50,
        sortBy,
        sortOrder,
    };

    // Fetch initial pools server-side with filters
    const initialData = await getPoolsServerSide(filters);

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            {/* Hero Section */}
            <MarketplaceHero />

            <div id="listings" className="container mx-auto px-4 py-8 -mt-8 relative z-10">
                {/* Controls Bar */}
                <MarketplaceInteractive 
                    initialPools={initialData.data}
                    initialHasMore={initialData.hasMore}
                    initialTotal={initialData.total}
                />

                {/* Pools Display with Suspense */}
                <ErrorBoundary>
                    <Suspense fallback={<PoolsGridSkeleton count={9} />}>
                        {initialData.data.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <PoolsGridView pools={initialData.data} />
                        )}
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    );
}
