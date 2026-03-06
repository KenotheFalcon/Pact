'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Leaf, Star, ArrowRight, ShoppingBag } from 'lucide-react';
import type { Listing } from '@/types/database';
import { formatDistance } from '@/lib/location';
import { motion } from 'framer-motion';

interface ListingCardProps {
    listing: Listing;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

export function ListingCard({ listing }: ListingCardProps) {
    const [imageError, setImageError] = useState(false);

    const primaryImage = listing.images && listing.images.length > 0
        ? listing.images[0]
        : PLACEHOLDER_IMAGE;

    return (
        <Link href={`/marketplace/listings/${listing.id}`} className="block h-full">
            <div className="group relative h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-pact-green/10 hover:-translate-y-1">
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                    <Image
                        src={imageError ? PLACEHOLDER_IMAGE : primaryImage}
                        alt={listing.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => setImageError(true)}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {listing.organic && (
                            <div className="flex items-center px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-sm">
                                <Leaf className="w-3 h-3 mr-1" aria-hidden="true" />
                                Organic
                            </div>
                        )}
                    </div>

                    <div className="absolute top-3 right-3">
                        <div className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-white/10 text-xs font-bold text-zinc-900 dark:text-white shadow-sm">
                            {listing.category}
                        </div>
                    </div>

                    <div className="absolute bottom-3 left-3">
                        {listing.distance !== undefined && (
                            <div className="flex items-center px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-sm">
                                <MapPin className="w-3 h-3 mr-1 text-pact-green" aria-hidden="true" />
                                {formatDistance(listing.distance)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col h-[calc(100%-14rem)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg leading-tight text-zinc-900 dark:text-white line-clamp-1 group-hover:text-pact-green transition-colors">
                                {listing.name}
                            </h3>
                            {listing.farmer && (
                                <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                    <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold mr-1.5">
                                        {listing.farmer.display_name?.charAt(0) ?? '?'}
                                    </div>
                                    <span className="truncate max-w-[120px]">
                                        {listing.farmer.display_name ?? 'Unknown farmer'}
                                    </span>
                                    {listing.farmer.rating && listing.farmer.rating > 0 && (
                                        <span className="flex items-center ml-2 text-amber-500">
                                            <Star className="w-3 h-3 fill-current mr-0.5" aria-hidden="true" />
                                            {listing.farmer.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 min-h-[2.5em]">
                        {listing.description}
                    </p>

                    {/* Price & Action */}
                    <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Price</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-extrabold text-pact-green">₦{listing.price_per_unit.toLocaleString()}</span>
                                <span className="text-xs text-zinc-500">/{listing.unit}</span>
                            </div>
                        </div>

                        <Button size="sm" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-pact-green dark:hover:bg-pact-green hover:text-white dark:hover:text-white transition-all rounded-full px-4 shadow-sm group-hover:shadow-md">
                            View
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
