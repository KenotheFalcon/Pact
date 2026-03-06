'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'
import { ID_DISPLAY_LENGTH } from '@/lib/constants'
import { staggerContainerVariants, staggerItemVariants, pageVariants } from '@/lib/animations'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Package, Truck, CheckCircle, AlertCircle } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type Order = {
    id: string
    created_at: string
    status: string
    total_amount: number
    quantity: number
    product_name: string // Joined from listings
    buyer_name: string // Joined from profiles
}

export default function FarmerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const prefersReducedMotion = useReducedMotion()

    useEffect(() => {
        const fetchOrders = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Fetch orders with related listing and buyer details
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    listing:listings(name),
                    buyer:profiles(full_name)
                `)
                .order('created_at', { ascending: false })

            if (data) {
                const formattedOrders: Order[] = data.map((order) => {
                    const ext = order as unknown as { listing?: { name?: string }, buyer?: { full_name?: string }, amount?: number, id?: string, created_at?: string, status?: string, quantity?: number }
                    return {
                        id: ext.id || '',
                        created_at: ext.created_at || '',
                        status: ext.status || '',
                        total_amount: ext.amount || 0,
                        quantity: ext.quantity || 0,
                        product_name: ext.listing?.name || 'Unknown Product',
                        buyer_name: ext.buyer?.full_name || 'Unknown Buyer'
                    }
                })
                setOrders(formattedOrders)
            }
            setLoading(false)
        }

        fetchOrders()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const MotionDiv = prefersReducedMotion ? 'div' : motion.div

    return (
        <MotionDiv 
            {...(!prefersReducedMotion && { variants: pageVariants, initial: "initial", animate: "animate" })}
            className="min-h-screen bg-background"
        >
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h1 className="font-heading text-3xl font-bold tracking-tight">Orders</h1>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="px-3 py-1">
                                Total: {orders.length}
                            </Badge>
                        </div>
                    </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50" />
                            <CardContent className="h-32" />
                        </Card>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No orders yet</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            When buyers purchase your produce, the orders will appear here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <MotionDiv 
                        {...(!prefersReducedMotion && { variants: staggerContainerVariants, initial: "hidden", animate: "visible" })}
                        className="grid gap-4 md:hidden"
                    >
                        {orders.map((order) => (
                            <MotionDiv key={order.id} {...(!prefersReducedMotion && { variants: staggerItemVariants })}>
                            <Card className="border-border">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-medium text-foreground">{order.product_name}</h3>
                                            <p className="text-sm text-muted-foreground">{order.buyer_name}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            ₦{order.total_amount?.toLocaleString() ?? '0'}
                                        </span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            ID: {order.id.slice(0, ID_DISPLAY_LENGTH)}...
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            </MotionDiv>
                        ))}
                    </MotionDiv>

                    {/* Desktop Table View */}
                    <div className="rounded-md border bg-card overflow-hidden hidden md:block">
                        <div className="relative w-full overflow-x-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                                        <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                                        <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Buyer</th>
                                        <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                        <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th scope="col" className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-mono text-xs">{order.id.slice(0, ID_DISPLAY_LENGTH)}...</td>
                                            <td className="p-4 align-middle font-medium">{order.product_name}</td>
                                            <td className="p-4 align-middle">{order.buyer_name}</td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">
                                                ₦{order.total_amount?.toLocaleString() ?? '0'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
                </div>
            </div>
        </MotionDiv>
    )
}
