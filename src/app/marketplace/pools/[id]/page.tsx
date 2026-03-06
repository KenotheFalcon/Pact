
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PactService } from '@/services/pact.service';
import { PoolChat } from '@/components/marketplace/PoolChat';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, ChevronLeft, ShieldCheck, Share2, Info, CheckCircle2, Package, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MotionWrapper } from '@/components/MotionWrapper';
import * as React from 'react';
import type { PoolMember } from '@/types/database';

// ISR: Revalidate pool detail every 3 minutes
export const revalidate = 180;
export const dynamic = 'force-static';
export const dynamicParams = true;

export default async function PoolDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    // 1. Get User Session
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch Pool Details
    let pool;
    try {
        pool = await PactService.getPoolDetails(params.id);
} catch {
        notFound();
    }

    if (!pool) notFound();

    // 3. Determine Membership & Logic
    const isMember = user ? pool.members.some((m: PoolMember) => m.user_id === user.id) : false;
    const isExpired = new Date(pool.expires_at) < new Date();
const isFull = pool.current_quantity >= pool.min_quantity;
    const progress = Math.min(100, (pool.current_quantity / pool.min_quantity) * 100);
    const timeRemaining = formatDistanceToNow(new Date(pool.expires_at), { addSuffix: true });

    const primaryImage = pool.listing?.images?.[0] || '/images/placeholder.svg';

    return (
        <div className="min-h-screen bg-background pb-32">

            {/* HERRO SECTION - Full Width Parallax */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <Image
                    src={primaryImage}
                    alt={pool.listing?.name || 'Pool'}
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                />

                {/* Cinema-grade Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 to-transparent" />

                {/* Navbar Placeholder - Absolute */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                    <Link href="/marketplace">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back</span>
                        </div>
                    </Link>
                    <div className="flex gap-3">
                        {isMember && (
                            <div className="px-4 py-2 rounded-full bg-pact-green/90 backdrop-blur-md text-white border border-pact-green/50 shadow-lg shadow-pact-green/20 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                                <CheckCircle2 className="w-4 h-4" />
                                Member
                            </div>
                        )}
<Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20" aria-label="Share this pool">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-24 flex flex-col items-start z-10">
                    <MotionWrapper>
                        <div className="flex flex-wrap gap-3 mb-4">
                            <Badge className={`px-3 py-1 text-sm font-medium border-0 backdrop-blur-md ${isFull ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-600/20'} shadow-lg`}>
                                {isFull ? 'Target Reached' : 'Open Pool'}
                            </Badge>
                            {pool.listing?.organic && (
                                <Badge variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-md px-3 py-1">
                                    Organic
                                </Badge>
                            )}
                            <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90">
                                <MapPin className="w-3 h-3 mr-1 text-pact-green" />
                                {pool.latitude ? `Location: ${pool.latitude.toFixed(2)}, ${pool.longitude?.toFixed(2)}` : 'Location varies'}
                            </div>
                        </div>

                        <h1 className="font-heading text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-sm leading-tight max-w-4xl">
                            {pool.listing?.name}
                        </h1>
                    </MotionWrapper>
                </div>
            </div>

            {/* MAIN CONTENT - Overlapping Grid */}
            <div className="container mx-auto px-4 relative z-20 -mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: Core Info & Stats (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Progress Card - Glassmorphism */}
                        <MotionWrapper delay={0.1}>
                            <div className="rounded-3xl p-8 border border-white/10 bg-white/85 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                                        <div>
                                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Pool Progress</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{Math.round(progress)}%</span>
                                                <span className="text-lg text-zinc-400 font-medium">funded</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-zinc-400 mb-1">Target</div>
                                            <div className="text-xl font-bold text-white">
                                                {pool.current_quantity} <span className="text-zinc-500">/</span> {pool.min_quantity} <span className="text-base font-normal text-zinc-400">{pool.listing?.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/5 mb-4">
                                        <div
                                            className="h-full bg-gradient-to-r from-pact-green to-emerald-400 rounded-full shadow-[0_0_20px_rgba(46,125,50,0.5)] transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                        <Info className="w-4 h-4" />
                                        <span>
                                            {isFull
                                                ? "Target reached! New orders are guaranteed."
                                                : `${pool.min_quantity - pool.current_quantity} more units needed to unlock wholesale pricing.`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </MotionWrapper>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Info */}
                            <MotionWrapper delay={0.2}>
                                <div className="bg-white dark:bg-zinc-900/80 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm h-full hover:border-pact-green/50 transition-colors">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-pact-green" aria-hidden="true" />
                                        </span>
                                        Product Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500">Price</span>
                                            <span className="text-xl font-bold text-pact-green">₦{pool.listing?.price_per_unit.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500">Unit</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{pool.listing?.unit}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500">Category</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">{pool.listing?.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </MotionWrapper>

                            {/* Leader Info */}
                            <MotionWrapper delay={0.25}>
                                <div className="bg-white dark:bg-zinc-900/80 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm h-full hover:border-pact-green/50 transition-colors">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-pact-green" aria-hidden="true" />
                                        </span>
                                        Trust & Quality
                                    </h3>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 p-0.5">
                                            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden relative">
                                                <Image
                                                    src="/images/avatar-placeholder.png"
                                                    alt="Leader"
                                                    fill
                                                    className="object-cover"
                                                    sizes="56px"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-white text-lg">{pool.leader?.full_name || "Community Leader"}</div>
                                            <div className="text-sm text-pact-green font-medium">Verified Merchant</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-500 leading-relaxed">
                                        This pool is managed by a top-rated leader. Produce is quality-checked at the farm gate before distribution.
                                    </p>
                                </div>
                            </MotionWrapper>
                        </div>
                    </div>

                    {/* RIGHT: Action / Chat (4 cols) - Sticky */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">

                            {/* NON-MEMBER: Join Card */}
                            {!isMember && (
                                <MotionWrapper delay={0.3}>
                                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-700 shadow-2xl relative overflow-hidden">
                                        {/* Glow Effect */}
                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pact-green/20 rounded-full blur-3xl pointer-events-none" />

                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 relative z-10">Join the Pact</h3>
                                        <p className="text-zinc-500 text-sm mb-8 relative z-10">
                                            Reserve your share now. Payments are held securely until the pool closes.
                                        </p>

                                        <div className="space-y-4 mb-8 relative z-10">
                                            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                                                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <Clock className="w-5 h-5 text-pact-green" />
                                                    <span>Time Left</span>
                                                </div>
                                                <span className="font-bold text-zinc-900 dark:text-white">{isExpired ? 'Ended' : timeRemaining.replace('about ', '')}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                                                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <Users className="w-5 h-5 text-pact-green" />
                                                    <span>Joined</span>
                                                </div>
                                                <div className="flex items-center gap-[-8px]">
                                                    <div className="flex -space-x-3 mr-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900" />
                                                        ))}
                                                    </div>
                                                    <span className="font-bold text-zinc-900 dark:text-white">{pool.members?.length || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            {isExpired ? (
                                                <Button disabled className="w-full h-14 text-lg rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                                    Pool Closed
                                                </Button>
                                            ) : (
                                                <Link href={user ? `/checkout/${pool.id}` : `/login?next=/marketplace/pools/${pool.id}`} className="block">
                                                    <Button className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-pact-green to-emerald-600 hover:to-emerald-500 text-white shadow-lg shadow-pact-green/30 transform transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                                                        Join Pool Now
                                                        <ShieldCheck className="w-5 h-5 ml-2 opacity-80" />
                                                    </Button>
                                                </Link>
                                            )}
                                            {!user && (
                                                <p className="text-center text-xs text-zinc-400 mt-4">
                                                    Sign in required to participate
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </MotionWrapper>
                            )}

                            {/* MEMBER: Chat Interface */}
                            {isMember && (
                                <MotionWrapper delay={0.3}>
                                    <div className="flex flex-col h-[500px] md:h-[650px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden relative">
                                        {/* Header */}
                                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    Pool Chat
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Coordinate with {pool.members.length} members</p>
                                            </div>
<Button size="icon" variant="ghost" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Pool chat information">
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Chat Component */}
                                        <div className="flex-1 overflow-hidden relative z-0">
                                            <PoolChat poolId={pool.id} currentUser={user} />
                                        </div>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-zinc-400">
                                            Payments are secure. Only trade within Pact.
                                        </p>
                                    </div>
                                </MotionWrapper>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
