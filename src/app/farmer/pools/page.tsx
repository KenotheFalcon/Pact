'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pool } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Plus, Users, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function FarmerPoolsPage() {
    const [pools, setPools] = useState<Pool[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const fetchPools = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch pools where the farmer is the leader (or involved)
            // Assuming for now farmer creates pools for their listings
            const { data, error } = await supabase
                .from('pools')
                .select(`
          *,
          listing:listings(name, unit, price_per_unit),
          leader:profiles(full_name)
        `)
                .eq('leader_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                // Silent fail - pools will show empty state
            } else {
                setPools(data as Pool[] || [])
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchPools()
    }, [fetchPools])

    const calculateProgress = (current: number, min: number) => {
        if (min === 0) return 0
        return Math.min(Math.round((current / min) * 100), 100)
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">Active Pools</h1>
                    <p className="text-muted-foreground mt-1">Manage your active pools</p>
                </div>
                <Button
                    onClick={() => router.push('/farmer/pools/create')}
                    className="bg-pact-green hover:bg-emerald-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pool
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading pools...</div>
            ) : pools.length === 0 ? (
                <div className="bg-card rounded-lg shadow overflow-hidden text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No active pools</h3>
                    <p className="text-muted-foreground mb-4">Create a pool to allow buyers to purchase in bulk.</p>
                    <Button
                        onClick={() => router.push('/farmer/pools/create')}
                        variant="outline"
                    >
                        Create First Pool
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pools.map((pool) => {
                        const progress = calculateProgress(pool.current_quantity, pool.min_quantity)

                        return (
                            <div key={pool.id} className="bg-card rounded-lg shadow overflow-hidden border border-border">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {pool.listing?.name || 'Unknown Product'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Expires: {new Date(pool.expires_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={pool.status === 'active' ? 'default' : 'secondary'}>
                                            {pool.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-pact-green h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                <span>{pool.current_quantity} {pool.listing?.unit}</span>
                                                <span>Target: {pool.min_quantity} {pool.listing?.unit}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Price: </span>
                                                <span className="font-medium">₦{pool.listing?.price_per_unit}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/farmer/pools/${pool.id}`)}>
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
