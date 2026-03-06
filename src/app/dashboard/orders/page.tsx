import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ID_DISPLAY_LENGTH } from '@/lib/constants'

import type { Order } from "@/types/database"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function MyOrdersPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's orders with typed response
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            pool:pools(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<Order[]>()

    return (
        <div className="space-y-4">
            {orders && orders.length > 0 ? (
                orders.map((order) => (
                    <Card key={order.id}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <CardTitle className="text-lg">Order #{order.id.slice(0, ID_DISPLAY_LENGTH)}</CardTitle>
                                    <span className="text-sm text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p>Pool: {order.pool?.listing?.name || 'Unknown Pool'}</p>
                            <p>Amount: ₦{order.amount?.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border text-muted-foreground">
                    No orders found. Join a Pact today!
                </div>
            )}
        </div>
    )
}
