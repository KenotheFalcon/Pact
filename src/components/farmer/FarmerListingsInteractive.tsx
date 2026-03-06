'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2 } from 'lucide-react';
import type { Listing } from '@/types/database';

interface FarmerListingsInteractiveProps {
    listings: Listing[];
}

/**
 * Client-side interactive component for farmer listings
 * Handles filtering, search, and mutations
 * Server-side data fetching is handled by the parent Server Component
 */
export function FarmerListingsInteractive({ listings }: FarmerListingsInteractiveProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [filteredListings, setFilteredListings] = useState<Listing[]>(listings);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Filter listings based on search and status
    const filterListings = useCallback(() => {
        let filtered = listings;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (listing) =>
                    listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    listing.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter((listing) => listing.status === statusFilter);
        }

        setFilteredListings(filtered);
    }, [listings, searchTerm, statusFilter]);

    useEffect(() => {
        filterListings();
    }, [filterListings]);

    const handleDeleteListing = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        setIsDeleting(listingId);

        try {
            const response = await fetch(`/api/farmer/listings/${listingId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Reload to reflect deletion
                router.refresh();
            } else {
                alert('Failed to delete listing. Please try again.');
            }
} catch {
            alert('Failed to delete listing. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEditListing = (listingId: string) => {
        router.push(`/farmer/listings/edit/${listingId}`);
    };

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'available', label: 'Available' },
        { value: 'sold_out', label: 'Sold Out' },
        { value: 'expired', label: 'Expired' },
        { value: 'inactive', label: 'Inactive' },
    ];

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card rounded-lg p-4 border border-border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Search listings…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredListings.length} of {listings.length} listings
            </div>

            {/* Listings Grid (replacing table for better mobile UX) */}
            {filteredListings.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                    <p className="text-muted-foreground">No listings found. Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredListings.map((listing) => (
                        <div
                            key={listing.id}
                            className="bg-card border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{listing.name}</h3>
                                        <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                            {listing.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {listing.category} • {listing.unit} •{' '}
                                        <strong>${listing.price_per_unit}</strong>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {listing.quantity} units available
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={() => handleEditListing(listing.id)}
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteListing(listing.id)}
                                        disabled={isDeleting === listing.id}
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                    >
                                        {isDeleting === listing.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
