'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ListingFilters } from '@/components/marketplace/ListingFilters';
import { MapPin, LayoutGrid, Map as MapIcon } from 'lucide-react';
import type { Pool, PoolFilters, ListingFilters as ListingFiltersType } from '@/types/database';
import { getUserLocation } from '@/lib/location';

interface MarketplaceInteractiveProps {
    initialPools: Pool[];
    initialHasMore: boolean;
    initialTotal: number;
}

/**
 * Client-side interactive component for marketplace
 * Handles user location, filters, and view mode toggle
 * Server-side pool data fetching is handled by the parent Server Component
 */
export function MarketplaceInteractive({
    initialPools,
    initialHasMore,
    initialTotal,
}: MarketplaceInteractiveProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    const handleViewModeChange = (mode: 'grid' | 'map') => {
        startTransition(() => {
            setViewMode(mode);
        });
    };

    // Get user location on mount
    useEffect(() => {
        getUserLocation().then((location) => {
            if (location) {
                setUserLocation(location);
            }
        });
    }, []);

    const handleFilterChange = (filters: ListingFiltersType) => {
        // Build URL search params for server-side refetch
        const params = new URLSearchParams();
        
        if (filters.category) params.set('category', filters.category);
        if (filters.latitude) params.set('latitude', filters.latitude.toString());
        if (filters.longitude) params.set('longitude', filters.longitude.toString());
        if (filters.radius) params.set('radius', filters.radius.toString());
        if (filters.sortBy) params.set('sortBy', filters.sortBy);

        // Use router.push to trigger server-side revalidation
        startTransition(() => {
            router.push(`/marketplace?${params.toString()}`);
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-border p-6 mb-8 transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Active Pools</h2>
                    {userLocation && (
                        <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground font-medium">
                            <MapPin className="w-4 h-4 text-pact-green" />
                            <span>Showing {initialTotal} pools near you</span>
                        </div>
                    )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl self-start md:self-auto border border-border">
                    <Button
                        onClick={() => handleViewModeChange('grid')}
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className="gap-2"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Grid
                    </Button>
                    <Button
                        onClick={() => handleViewModeChange('map')}
                        variant={viewMode === 'map' ? 'default' : 'ghost'}
                        size="sm"
                        className="gap-2"
                    >
                        <MapIcon className="w-4 h-4" />
                        Map
                    </Button>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
                <ListingFilters
                    onFilterChange={handleFilterChange}
                    userLocation={userLocation}
                />
            </div>
        </motion.div>
    );
}
