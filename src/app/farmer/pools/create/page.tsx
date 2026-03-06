'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPool } from '@/app/actions/pool';
import { createClient } from '@/lib/supabase/client';
import LocationPicker from '@/components/farmer/LocationPicker';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';

interface Listing {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
}

interface LocationData {
    latitude?: number;
    longitude?: number;
    address: string;
}

export default function CreatePoolPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]);
    const [formData, setFormData] = useState({
        listingId: '',
        minQuantity: 100,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        latitude: 0,
        longitude: 0,
        address: ''
    });

    useEffect(() => {
        const fetchListings = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('listings')
                    .select('id, name, unit, price_per_unit')
                    .eq('farmer_id', user.id) // Or fetch all available listings if leader is not farmer? Assuming leader creates pool for their own listing or any listing?
                    // For now, let's assume the "Leader" is the one creating the pool, and they pick a listing.
                    // If the user is a Farmer, they pick their own listings.
                    // If the user is a "Community Leader", they might pick any listing?
                    // Let's stick to Farmer creating pools for their own listings for this iteration as per "Farmer Dashboard".
                    .eq('status', 'available');

                if (data) setListings(data);
            }
        };
        fetchListings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('listingId', formData.listingId);
            formDataToSend.append('minQuantity', formData.minQuantity.toString());
            formDataToSend.append('expiresAt', formData.expiresAt);
            formDataToSend.append('latitude', formData.latitude.toString());
            formDataToSend.append('longitude', formData.longitude.toString());

            const result = await createPool(formDataToSend);

            if (result.success) {
                toast.success('Pool created successfully!');
                router.push('/farmer/pools');
            } else {
                toast.error(result.error || 'Failed to create pool');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationSelect = (location: LocationData) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.latitude || 0,
            longitude: location.longitude || 0,
            address: location.address
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-card rounded-lg shadow-md p-8">
                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Create Group Pool</h1>
                <p className="text-muted-foreground mb-8">
                    Start a pool for your produce to encourage bulk buying in a specific location.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Listing Selection */}
                    <div>
                        <label htmlFor="listingId" className="block text-sm font-medium text-foreground mb-2">
                            Select Product Listing
                        </label>
                        <select
                            id="listingId"
                            value={formData.listingId}
                            onChange={(e) => setFormData({ ...formData, listingId: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
                        >
                            <option value="">Choose a product listing...</option>
                            {listings.map((listing) => (
                                <option key={listing.id} value={listing.id}>
                                    {listing.name} - ₦{listing.price_per_unit}/{listing.unit}
                                </option>
                            ))}
                        </select>
                        {listings.length === 0 && (
                            <p className="text-sm text-red-500 mt-1">
                                You have no active listings. Create a listing first.
                            </p>
                        )}
                    </div>

                    {/* Target Quantity */}
                    <div>
                        <label htmlFor="minQuantity" className="block text-sm font-medium text-foreground mb-2">
                            Minimum Target Quantity
                        </label>
                        <input
                            type="number"
                            id="minQuantity"
                            value={formData.minQuantity}
                            onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                            min="10"
                            required
                            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            The pool will only execute if this quantity is reached.
                        </p>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-foreground mb-2">
                            Pool Deadline
                        </label>
                        <input
                            type="datetime-local"
                            id="expiresAt"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            required
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-pact-green"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Drop-off Location
                        </label>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                        <input type="hidden" name="latitude" value={formData.latitude} />
                        <input type="hidden" name="longitude" value={formData.longitude} />
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <LoadingButton
                            type="submit"
                            loading={isLoading}
                            loadingText="Creating…"
                            disabled={!formData.listingId}
                            className="flex-1 bg-pact-green text-white hover:bg-pact-green/90"
                        >
                            Create Pool
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
