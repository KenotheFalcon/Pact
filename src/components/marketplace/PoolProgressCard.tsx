'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Users, AlertCircle } from 'lucide-react';
import type { Pool } from '@/types/database';
import { formatDistance } from '@/lib/location';
import { formatDistanceToNow } from 'date-fns';

interface PoolProgressCardProps {
    pool: Pool;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

export function PoolProgressCard({ pool }: PoolProgressCardProps) {
    const [imageError, setImageError] = useState(false);

    // Calculate progress
    const progress = Math.min(100, (pool.current_quantity / pool.min_quantity) * 100);
    const isFull = pool.current_quantity >= pool.min_quantity;

    // Format expiry
    const timeRemaining = formatDistanceToNow(new Date(pool.expires_at), { addSuffix: true });
    const isExpired = new Date(pool.expires_at) < new Date();

    const primaryImage = pool.listing?.images && pool.listing.images.length > 0
        ? pool.listing.images[0]
        : PLACEHOLDER_IMAGE;

    return (
        <Link href={`/marketplace/pools/${pool.id}`} className="block h-full">
            <div className="group relative h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-pact-green/10 hover:-translate-y-1" style={{ contentVisibility: 'auto' }}>
                {/* Image Section */}
                <div className="relative h-52 overflow-hidden">
                    <Image
                        src={imageError ? PLACEHOLDER_IMAGE : primaryImage}
                        alt={pool.listing?.name || 'Pool Item'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Badges - Glassmorphism */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {pool.distance !== undefined && (
                            <div className="flex items-center px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-sm">
                                <MapPin className="w-3 h-3 mr-1 text-pact-green" aria-hidden="true" />
                                {formatDistance(pool.distance)}
                            </div>
                        )}
                    </div>

                    <div className="absolute top-3 right-3">
                        <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 text-xs font-bold shadow-sm ${isFull
                                ? 'bg-green-500/80 text-white'
                                : 'bg-blue-500/80 text-white'
                            }`}>
                            {isFull ? 'Locked' : 'Open'}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col h-[calc(100%-13rem)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg leading-tight text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-pact-green transition-colors">
                                {pool.listing?.name}
                            </h3>
                            <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                <Users className="w-3 h-3 mr-1.5" aria-hidden="true" />
                                <span className="truncate max-w-[120px]">
                                    By {pool.leader?.display_name || 'Community Member'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-extrabold text-pact-green tracking-tight">
                                ₦{pool.listing?.price_per_unit.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                Per {pool.listing?.unit}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-zinc-700 dark:text-zinc-300">
                                <span className="text-pact-green">{pool.current_quantity}</span>
                                <span className="text-zinc-400 mx-1">/</span>
                                {pool.min_quantity} {pool.listing?.unit}
                            </span>
                            <span className="text-pact-green">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-pact-green to-green-400 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {isFull
                                ? "Target reached! Pool is locked."
                                : `${pool.min_quantity - pool.current_quantity} more needed to unlock wholesale price.`}
                        </p>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400" aria-hidden="true" />
                                {isExpired ? 'Expired' : `Ends ${timeRemaining}`}
                            </div>
                            {pool.listing?.organic && (
                                <div className="flex items-center text-green-600 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                                    Organic
                                </div>
                            )}
                        </div>

                        <Button
                            className={`w-full font-semibold shadow-lg transition-all duration-300 ${isFull
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    : 'bg-pact-green text-white hover:bg-pact-green/90 hover:shadow-pact-green/25'
                                }`}
                            disabled={isExpired}
                        >
                            {isFull ? 'Join Waitlist' : 'Join Pool'}
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export const PoolProgressCardMemo = memo(PoolProgressCard);
