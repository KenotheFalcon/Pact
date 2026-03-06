import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FarmerStats, FarmerActivity } from '@/types/farmer';
import { Transaction, Notification } from '@/types/database';
import { StatCardMemo as StatCard } from '@/components/farmer/StatCard';
import { ActivityTimelineMemo as ActivityTimeline } from '@/components/farmer/ActivityTimeline';
import QuickActions from '@/components/farmer/QuickActions';
import { Package, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react';
import { MotionWrapper } from '@/components/MotionWrapper';
import DashboardHero from '@/components/farmer/DashboardHero';

/**
 * Server-side dashboard data fetching
 * Eliminates multiple useEffect calls and async waterfall
 */
async function getFarmerDashboardData(): Promise<{
    stats: FarmerStats | null;
    activities: FarmerActivity[];
}> {
    const supabase = await createClient();

    // Get current user
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
            .select('id, display_name, bio, avatar_url, rating, role')
            .eq('id', user.id)
            .eq('role', 'farmer')
            .single();

        if (!farmerData) {
            redirect('/farmer/onboarding');
        }

        // Parallel fetch all dashboard data
        const [
            { count: totalListings },
            { count: activeListings },
            { count: activePools },
            { data: transactionsData },
            { data: notificationsData },
        ] = await Promise.all([
            // Get total listings
            supabase
                .from('listings')
                .select('id', { count: 'exact', head: true })
                .eq('farmer_id', farmerData.id),

            // Get active listings
            supabase
                .from('listings')
                .select('id', { count: 'exact', head: true })
                .eq('farmer_id', farmerData.id)
                .eq('status', 'available'),

            // Get active pools led by farmer
            supabase
                .from('pools')
                .select('id', { count: 'exact', head: true })
                .eq('leader_id', user.id)
                .eq('status', 'active'),

            // Get transactions for earnings
            supabase
                .from('transactions')
                .select('id, amount, type, status, created_at')
                .eq('farmer_id', farmerData.id)
                .order('created_at', { ascending: false })
                .limit(100),

            // Get recent notifications for activity
            supabase
                .from('notifications')
                .select('id, type, title, message, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        // Calculate stats
        const transactions = (transactionsData as Transaction[]) || [];
        const totalEarnings = transactions
            .filter((t) => t.type === 'sale' && t.status === 'completed')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const pendingEarnings = transactions
            .filter((t) => t.type === 'sale' && t.status === 'pending')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalSales = transactions.filter(
            (t) => t.type === 'sale' && t.status === 'completed'
        ).length;

        const stats: FarmerStats = {
            totalListings: totalListings || 0,
            activeListings: activeListings || 0,
            totalEarnings,
            pendingEarnings,
            activePools: activePools || 0,
            totalSales,
        };

        // Map notifications to activities
        const VALID_ACTIVITY_TYPES = ['listing_created', 'listing_sold', 'pool_completed', 'payment_received'] as const;
        type ActivityType = typeof VALID_ACTIVITY_TYPES[number];
        const notifications = (notificationsData as Notification[]) || [];
        const activities: FarmerActivity[] = notifications.map((n) => ({
            id: n.id,
            type: (VALID_ACTIVITY_TYPES.includes(n.type as ActivityType) ? n.type : 'payment_received') as ActivityType,
            title: n.title,
            description: n.message,
            timestamp: n.created_at,
            status: 'success',
        }));

        return { stats, activities };
    } catch {
        return { stats: null, activities: [] };
    }
}

/**
 * Loading skeleton for dashboard
 */
function DashboardLoadingSkeleton() {
    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="h-24 bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
            <div className="h-40 bg-muted animate-pulse rounded-lg" />
        </div>
    );
}

export const metadata = {
    title: 'Farmer Dashboard | Pact',
    description: 'Manage your listings, pools, and earnings',
};

export const revalidate = 300; // Revalidate every 5 minutes for stats

export default async function FarmerDashboard() {
    const { stats, activities } = await getFarmerDashboardData();

    if (!stats) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <DashboardHero />

            <QuickActions />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MotionWrapper delay={0.1}>
                    <StatCard
                        title="Total Listings"
                        value={stats.totalListings}
                        icon={Package}
                        trend={{ value: 12, label: 'vs last month' }}
                    />
                </MotionWrapper>
                <MotionWrapper delay={0.2}>
                    <StatCard
                        title="Total Earnings"
                        value={`₦${stats.totalEarnings.toLocaleString()}`}
                        icon={DollarSign}
                        trend={{ value: 8, label: 'vs last month' }}
                    />
                </MotionWrapper>
                <MotionWrapper delay={0.3}>
                    <StatCard
                        title="Active Pools"
                        value={stats.activePools}
                        icon={Users}
                        trend={{ value: -2, label: 'vs last month' }}
                    />
                </MotionWrapper>
                <MotionWrapper delay={0.4}>
                    <StatCard
                        title="Ready to Ship"
                        value={0}
                        icon={TrendingUp}
                        trend={{ value: 0, label: 'Pending Output' }}
                        className="border-pact-orange bg-orange-50 dark:bg-orange-900/10"
                    />
                </MotionWrapper>
            </div>

            {/* Ready to Ship Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 className="font-heading text-xl font-bold text-foreground">Ready to Ship</h2>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    <p>No filled pools requiring shipment yet.</p>
                </div>
            </div>

            {/* Recent Activity */}
            <Suspense
                fallback={
                    <div className="h-64 bg-muted animate-pulse rounded-2xl" />
                }
            >
                <MotionWrapper delay={0.5}>
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="font-heading text-lg font-bold text-foreground">
                                Recent Activity
                            </h2>
                            <button className="text-sm text-pact-green hover:text-emerald-600 font-medium transition-colors">
                                View All
                            </button>
                        </div>
                        <ActivityTimeline activities={activities} />
                    </div>
                </MotionWrapper>
            </Suspense>
        </div>
    );
}