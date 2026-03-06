import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Listing } from '@/types/database';
import ListingTable from '@/components/farmer/ListingTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { FarmerListingsInteractive } from '@/components/farmer/FarmerListingsInteractive';

/**
 * Server-side listing fetch for authenticated farmer
 * Eliminates useEffect waterfalls and multiple auth checks
 */
async function getFarmerListings() {
    const supabase = await createClient();

    // Get current user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    try {
        // Get farmer profile from profiles table
        const { data: farmerData } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .eq('role', 'farmer')
            .single();

        if (!farmerData) {
            // User is authenticated but not a farmer
            return null;
        }

        // Fetch farmer's listings with optimized columns
        const { data: listings, error } = await supabase
            .from('listings')
            .select(`
                id,
                name,
                description,
                category,
                status,
                price_per_unit,
                unit,
                quantity,
                min_quantity,
                organic,
                created_at,
                updated_at,
                images,
                farmer_id,
                latitude,
                longitude,
                address,
                city,
                country
            `)
            .eq('farmer_id', farmerData.id)
            .order('created_at', { ascending: false });

        if (error) {
            // Silent fail - return empty array
            return [];
        }

        return listings || [];
    } catch {
        // Silent fail - return empty array
        return [];
    }
}

/**
 * Loading skeleton for listings table
 */
function ListingsLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
        </div>
    );
}

export const metadata = {
    title: 'My Listings | Pact Farmer Dashboard',
    description: 'Manage your produce listings',
};

export const revalidate = 3600; // Revalidate every hour

export default async function FarmerListingsPage() {
    const listings = await getFarmerListings();

    if (listings === null) {
        // User is not a farmer, redirect to farmer onboarding
        redirect('/farmer/onboarding');
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="font-heading text-3xl font-bold">My Listings</h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage your produce listings ({listings.length} total)
                                </p>
                            </div>
                            <Link href="/farmer/listings/create">
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Listing
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Interactive Filter Component */}
                    <FarmerListingsInteractive listings={listings} />

                    {/* Listings Table with Suspense */}
                    <Suspense fallback={<ListingsLoadingSkeleton />}>
                        <FarmerListingsContent listings={listings} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

/**
 * Separate async component for listings content
 * This allows Suspense to work properly with server-side data
 */
async function FarmerListingsContent({ listings }: { listings: Listing[] }) {
    return (
        <ListingTable
            listings={listings}
            loading={false}
            onEdit={() => {
                // Navigation handled by FarmerListingsInteractive
            }}
            onDelete={async () => {
                // Delete handled by Server Action in FarmerListingsInteractive
            }}
        />
    );
}