import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { ID_DISPLAY_LENGTH } from '@/lib/constants';
import { getStatusColor } from '@/lib/utils/status-colors';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedOrdersGrid, AnimatedOrderCard } from '@/components/buyer/AnimatedOrdersGrid';
import { ReportIssueButton } from '@/components/buyer/ReportIssueButton';

import { ShoppingBag } from 'lucide-react';

type OrderRow = {
    id: string;
    user_id?: string;
    buyer_id?: string;
    listing_id?: string;
    product_id?: string;
    quantity?: number;
    amount?: number;
    total_amount?: number;
    status?: string;
    payment_status?: string;
    payment_reference?: string;
    created_at?: string;
};

/**
 * Server-side order fetching for authenticated buyer
 * Eliminates useEffect waterfalls and client-side auth checks
 */
async function getBuyerOrders(): Promise<OrderRow[]> {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    try {
        // Fetch orders with optimized columns
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                user_id,
                buyer_id,
                listing_id,
                product_id,
                quantity,
                amount,
                total_amount,
                status,
                payment_status,
                payment_reference,
                created_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            // Silent fail for production
            return [];
        }

        return orders || [];
    } catch {
        // Silent fail for production
        return [];
    }
}

/**
 * Loading skeleton for orders table
 */
function OrdersLoadingSkeleton() {
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
    title: 'My Orders | Pact',
    description: 'View your order history',
};

export const revalidate = 3600; // Revalidate every hour

export default async function OrdersPage() {
    const orders = await getBuyerOrders();

    return (
        <section className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Orders</h2>
                <span className="text-sm text-muted-foreground">
                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
            </div>

            <Suspense fallback={<OrdersLoadingSkeleton />}>
                <OrdersTable orders={orders} />
            </Suspense>
        </section>
    );
}

/**
 * Orders table component with mobile card view
 */
function OrdersTable({ orders }: { orders: OrderRow[] }) {
    if (orders.length === 0) {
        return (
            <EmptyState
                icon={ShoppingBag}
                title="No orders found"
                description="Start shopping to see your orders here"
                compact
            />
        );
    }

    return (
        <>
            {/* Mobile Card View */}
            <AnimatedOrdersGrid className="grid gap-4 md:hidden">
                {orders.map((o) => (
                    <AnimatedOrderCard key={o.id}>
                    <Card className="border-border">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        Order #{o.id.slice(0, ID_DISPLAY_LENGTH)}...
                                    </p>
                                    <p className="font-semibold text-foreground mt-1">
                                        ₦{(o.total_amount ?? o.amount ?? 0).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(o.status ?? o.payment_status ?? 'pending')}`}>
                                    {o.status ?? o.payment_status ?? 'pending'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Qty: {o.quantity ?? '-'}</span>
                                <div className="flex items-center gap-2">
                                    <span>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</span>
                                    <ReportIssueButton orderId={o.id} orderRef={o.id.slice(0, ID_DISPLAY_LENGTH)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </AnimatedOrderCard>
                ))}
            </AnimatedOrdersGrid>

            {/* Desktop Table View */}
            <div className="rounded-lg border overflow-hidden hidden md:block">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-medium">Order</th>
                            <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                            <th scope="col" className="px-4 py-3 text-left font-medium">Quantity</th>
                            <th scope="col" className="px-4 py-3 text-left font-medium">Amount</th>
                            <th scope="col" className="px-4 py-3 text-left font-medium">Created</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className="border-t hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, ID_DISPLAY_LENGTH)}...</td>
                                <td className="px-4 py-3 capitalize">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(o.status ?? o.payment_status ?? 'pending')}`}>
                                        {o.status ?? o.payment_status ?? 'pending'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{o.quantity ?? '-'}</td>
                                <td className="px-4 py-3 font-semibold">
                                    ₦{(o.total_amount ?? o.amount ?? 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <ReportIssueButton orderId={o.id} orderRef={o.id.slice(0, ID_DISPLAY_LENGTH)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}