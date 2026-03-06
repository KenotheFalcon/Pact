'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    Leaf,
    Calendar,
    Package,
    Star,
    Loader2,
    ArrowLeft,
    ShoppingCart,
} from 'lucide-react';
import type { Listing, Pool } from '@/types/database';
import { formatLocation } from '@/lib/location';

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params.id as string;

    const [listing, setListing] = useState<Listing | null>(null);
    const [groupBuys, setGroupBuys] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);

    const fetchListing = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/listings/${listingId}`);
            const result = await response.json();

            if (result.success && result.data) {
                setListing(result.data);
                // Fetch associated pools
                fetchGroupBuys(result.data.id);
            } else {
                setError(result.error || 'Listing not found');
            }
        } catch (err) {
            setError('Failed to load listing');
        } finally {
            setLoading(false);
        }
    }, [listingId]);

    useEffect(() => {
        if (listingId) {
            fetchListing();
        }
    }, [listingId, fetchListing]);

    const fetchGroupBuys = async (listingId: string) => {
        try {
            const response = await fetch(`/api/pools?listing_id=${listingId}&status=active`);
            const result = await response.json();
            if (result.success) {
                setGroupBuys(result.data || []);
            }
} catch {
            // Silent fail - pools not critical for listing page
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="text-center py-16">
                            <p className="text-xl text-muted-foreground">{error || 'Listing not found'}</p>
                            <Button onClick={() => router.push('/marketplace')} className="mt-4">
                                Back to Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

const images = listing.images && listing.images.length > 0
        ? listing.images
        : ['/images/placeholder.svg'];

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Images and Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <Card className="overflow-hidden">
                            <div className="relative h-96 bg-muted">
                                <Image
                                    src={images[selectedImage]}
                                    alt={listing.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                />
                                {listing.organic && (
                                    <Badge className="absolute top-4 right-4 bg-green-600 hover:bg-green-700">
                                        <Leaf className="w-3 h-3 mr-1" />
                                        Organic
                                    </Badge>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${selectedImage === idx ? 'border-primary' : 'border-transparent'
                                                }`}
                                        >
                                            <Image src={img} alt={`${listing.name} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>About this product</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                            </CardContent>
                        </Card>

                        {/* Farmer Info */}
                        {listing.farmer && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Farmer Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-semibold text-lg">{listing.farmer.display_name || listing.farmer.full_name}</p>
                                            {listing.farmer.bio && (
                                                <p className="text-sm text-muted-foreground mt-1">{listing.farmer.bio}</p>
                                            )}
                                        </div>

                                        {listing.farmer.rating && listing.farmer.rating > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-semibold">{listing.farmer.rating.toFixed(1)}</span>
                                                </div>
                                                {listing.farmer.total_reviews && (
                                                    <span className="text-sm text-muted-foreground">
                                                        ({listing.farmer.total_reviews} reviews)
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{listing.city}, {listing.country}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Purchase Info */}
                    <div className="space-y-6">
                        {/* Product Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">{listing.name}</CardTitle>
                                <CardDescription>
                                    <Badge variant="outline">{listing.category}</Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div>
                                    <div className="text-4xl font-bold text-primary">
                                        ₦{listing.price_per_unit.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">per {listing.unit}</div>
                                </div>

                                <Separator />

                                {/* Details */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Available
                                        </span>
                                        <span className="font-medium">{listing.quantity} {listing.unit}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4" />
                                            Min. pool size
                                        </span>
                                        <span className="font-medium">{listing.min_quantity} {listing.unit}</span>
                                    </div>

                                    {listing.harvest_date && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Harvested
                                            </span>
                                            <span className="font-medium">
                                                {new Date(listing.harvest_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Location
                                        </span>
                                        <span className="font-medium">{listing.city}</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Actions */}
                                <div className="space-y-2">
                                    <Link href={`/marketplace/pools/create?listing_id=${listing.id}`}>
                                        <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                                            Start Pool
                                        </Button>
                                    </Link>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Start a pool or join an existing one below
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Active Pools for this Listing */}
                {groupBuys.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Active Pools</h2>
                        <p className="text-muted-foreground">Pool cards will be displayed here.</p>
                    </div>
                )}

                {groupBuys.length === 0 && (
                    <Card className="mt-12">
                        <CardContent className="text-center py-12">
                            <p className="text-muted-foreground mb-4">No active pools for this listing yet</p>
                            <Link href={`/marketplace/pools/create?listing_id=${listing.id}`}>
                                <Button className="bg-primary hover:bg-primary/90">
                                    Be the first to create one!
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
