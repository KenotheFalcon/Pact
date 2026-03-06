'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Clock,
    Users,
    Package,
    MapPin,
    Loader2,
    ArrowLeft,
    ShoppingCart,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import type { Pool } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

export default function GroupBuyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupBuyId = params.id as string;

    const [groupBuy, setGroupBuy] = useState<Pool | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joinQuantity, setJoinQuantity] = useState(1);
    const [joiningError, setJoiningError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchGroupBuy = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/pools/${groupBuyId}`);
            const result = await response.json();

            if (result.success && result.data) {
                setGroupBuy(result.data);
            } else {
                setError(result.error || 'Pool not found');
            }
        } catch (err) {
            setError('Failed to load pool');
        } finally {
            setLoading(false);
        }
    }, [groupBuyId]);

    useEffect(() => {
        checkAuth();
        if (groupBuyId) {
            fetchGroupBuy();
        }
    }, [groupBuyId, fetchGroupBuy]);

    const checkAuth = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
    };

    const handleJoinGroupBuy = async () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/marketplace/pools/${groupBuyId}`);
            return;
        }

        if (joinQuantity <= 0) {
            setJoiningError('Please enter a valid quantity');
            return;
        }

        try {
            setIsJoining(true);
            setJoiningError('');

            const response = await fetch(`/api/pools/${groupBuyId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: joinQuantity }),
            });

            const result = await response.json();

            if (result.success && result.data?.payment_url) {
                // Redirect to Paystack payment
                window.location.href = result.data.payment_url;
            } else {
                setJoiningError(result.error || 'Failed to join pool');
            }
        } catch (err) {
            setJoiningError('Failed to process request');
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !groupBuy || !groupBuy.listing) {
        return (
            <div className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="text-center py-16">
                            <p className="text-xl text-muted-foreground">{error || 'Pool not found'}</p>
                            <Button onClick={() => router.push('/marketplace/pools')} className="mt-4">
                                Back to Pools
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const progress = groupBuy.progress || 0;
    const remainingQuantity = groupBuy.min_quantity - groupBuy.current_quantity;
    const daysLeft = Math.ceil(
        (new Date(groupBuy.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const hoursLeft = Math.ceil(
        (new Date(groupBuy.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    const totalPrice = joinQuantity * groupBuy.listing.price_per_unit;

    const getStatusColor = () => {
        if (groupBuy.status === 'funded') return 'bg-green-600';
        if (groupBuy.status === 'completed') return 'bg-pact-green';
        if (groupBuy.status === 'cancelled') return 'bg-gray-600';
        if (groupBuy.status === 'expired') return 'bg-gray-600';
        if (progress >= 80) return 'bg-primary';
        if (progress >= 50) return 'bg-amber-500';
        return 'bg-gray-500';
    };

const canJoin = groupBuy.status === 'active' && daysLeft > 0;
    const primaryImage = groupBuy.listing.images && groupBuy.listing.images.length > 0
        ? groupBuy.listing.images[0]
        : '/images/placeholder.svg';

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Info */}
                        <Card>
                            <div className="relative h-64 bg-muted">
                                <Image
                                    src={primaryImage}
                                    alt={groupBuy.listing.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                />
                                <Badge className={`absolute top-4 right-4 ${getStatusColor()}`}>
                                    {groupBuy.status.toUpperCase()}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-2xl">{groupBuy.listing.name}</CardTitle>
                                <CardDescription>
                                    <Badge variant="outline" className="mr-2">{groupBuy.listing.category}</Badge>
                                    <span className="text-muted-foreground">{groupBuy.listing.description}</span>
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Progress */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pool Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Funding Progress</span>
                                        <span className="text-sm font-bold">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-4" />
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{groupBuy.current_quantity} {groupBuy.listing.unit} funded</span>
                                        <span>{remainingQuantity} {groupBuy.listing.unit} remaining</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div className="text-2xl font-bold">{groupBuy.min_quantity}</div>
                                        <div className="text-xs text-muted-foreground">Target</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="text-2xl font-bold">{groupBuy.members?.length || 0}</div>
                                        <div className="text-xs text-muted-foreground">Participants</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Time Left</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Participants */}
                        {groupBuy.members && groupBuy.members.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Participants ({groupBuy.members.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {groupBuy.members.slice(0, 10).map((participant, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                                <span className="text-sm">Participant {idx + 1}</span>
                                                <span className="text-sm font-medium">
                                                    {participant.quantity_pledged} {groupBuy.listing?.unit}
                                                </span>
                                            </div>
                                        ))}
                                        {groupBuy.members.length > 10 && (
                                            <p className="text-sm text-muted-foreground text-center pt-2">
                                                +{groupBuy.members.length - 10} more participants
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Join Card */}
                    <div>
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Join This Pool</CardTitle>
                                <CardDescription>
                                    Save by buying in bulk with others
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div>
                                    <div className="text-3xl font-bold text-primary">
                                        ₦{groupBuy.listing.price_per_unit.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">per {groupBuy.listing.unit}</div>
                                </div>

                                <Separator />

                                {/* Details */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Deadline
                                        </span>
                                        <span className="font-medium">
                                            {new Date(groupBuy.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Location
                                        </span>
                                        <span className="font-medium">{groupBuy.listing.city}</span>
                                    </div>
                                </div>

                                {canJoin ? (
                                    <>
                                        <Separator />

                                        {/* Quantity Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="quantity">Quantity ({groupBuy.listing.unit})</Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min="1"
                                                max={remainingQuantity}
                                                value={joinQuantity}
                                                onChange={(e) => setJoinQuantity(parseInt(e.target.value) || 1)}
                                                className="text-lg"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Max: {remainingQuantity} {groupBuy.listing.unit}
                                            </p>
                                        </div>

                                        {/* Total Price */}
                                        <div className="bg-muted p-4 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Total Price</span>
                                                <span className="text-2xl font-bold text-primary">
                                                    ₦{totalPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Error Message */}
                                        {joiningError && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{joiningError}</span>
                                            </div>
                                        )}

                                        {/* Join Button */}
                                        <Button
                                            onClick={handleJoinGroupBuy}
                                            disabled={isJoining || joinQuantity > remainingQuantity}
                                            className="w-full bg-primary hover:bg-primary/90"
                                            size="lg"
                                        >
                                            {isJoining ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                    Join Pool
                                                </>
                                            )}
                                        </Button>

                                        {!isAuthenticated && (
                                            <p className="text-xs text-center text-muted-foreground">
                                                You&apos;ll be asked to login before payment
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <Badge className={`mb-2 ${getStatusColor()}`}>
                                            {groupBuy.status.toUpperCase()}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            {groupBuy.status === 'funded' && 'This pool is fully funded!'}
                                            {groupBuy.status === 'completed' && 'This pool has been completed'}
                                            {groupBuy.status === 'expired' && 'This pool has expired'}
                                            {groupBuy.status === 'cancelled' && 'This pool was cancelled'}
                                        </p>
                                    </div>
                                )}

                                <Separator />

                                <Link href={`/marketplace/listings/${groupBuy.listing_id}`}>
                                    <Button variant="outline" className="w-full">
                                        View Product Details
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
