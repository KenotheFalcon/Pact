'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'
import { createClient } from '@/lib/supabase/client'
import { POOL_STATUS } from '@/lib/constants'

interface PoolItem {
  id: string
  produceName: string
  pricePerUnit: number
  unitQuantity: string
  farmerName: string
  farmerLocation: string
  overallQuantity: number
  unitQuantityValue: number
  unitsCommitted: number
  image: string
  isFallback?: boolean
}

interface DbPool {
  id: string
  min_quantity: number
  current_quantity: number
  status: string
  listing: {
    id: string
    name: string
    price_per_unit: number
    unit: string
    quantity: number
    image_url: string | null
    farmer: {
      id: string
      display_name: string | null
      location: string | null
    } | null
  } | null
}

function parseUnitValue(unit: string): number {
  const match = unit.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

export function ActivePoolsSection() {
  const router = useRouter()
  const supabase = createClient()
  const prefersReducedMotion = useReducedMotion()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pools, setPools] = useState<PoolItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActivePools = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select(`
          id,
          min_quantity,
          current_quantity,
          status,
          listing:listings(
            id,
            name,
            price_per_unit,
            unit,
            quantity,
            image_url,
            farmer:profiles!listings_farmer_id_fkey(
              id,
              display_name,
              location
            )
          )
        `)
        .eq('status', POOL_STATUS.ACTIVE)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error || !data || data.length === 0) {
        const fallbackRes = await fetch('/api/pools/fallback')
        const fallbackData = await fallbackRes.json()
        if (fallbackData.success && fallbackData.data.pools) {
          setPools(fallbackData.data.pools.map((p: PoolItem) => ({ ...p, isFallback: true })))
        }
        return
      }

      const transformedPools: PoolItem[] = (data as unknown as DbPool[])
        .filter(pool => pool.listing)
        .map(pool => {
          const listing = pool.listing!
          const farmer = listing.farmer
          const unitValue = parseUnitValue(listing.unit)
          const totalUnits = Math.floor(listing.quantity / unitValue)
          const committedUnits = Math.floor((pool.current_quantity || 0) / unitValue)

          return {
            id: pool.id,
            produceName: listing.name,
            pricePerUnit: listing.price_per_unit,
            unitQuantity: listing.unit,
            farmerName: farmer?.display_name || 'Unknown Farm',
            farmerLocation: farmer?.location || 'Nigeria',
            overallQuantity: listing.quantity,
            unitQuantityValue: unitValue,
            unitsCommitted: committedUnits,
            image: listing.image_url || '/images/placeholder.svg'
          }
        })

      if (transformedPools.length > 0) {
        setPools(transformedPools)
      } else {
        const fallbackRes = await fetch('/api/pools/fallback')
        const fallbackData = await fallbackRes.json()
        if (fallbackData.success && fallbackData.data.pools) {
          setPools(fallbackData.data.pools.map((p: PoolItem) => ({ ...p, isFallback: true })))
        }
      }
    } catch {
      const fallbackRes = await fetch('/api/pools/fallback')
      const fallbackData = await fallbackRes.json()
      if (fallbackData.success && fallbackData.data.pools) {
        setPools(fallbackData.data.pools.map((p: PoolItem) => ({ ...p, isFallback: true })))
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
    fetchActivePools()
  }, [supabase, fetchActivePools])

  const handleJoinPool = (poolId: string) => {
    if (poolId.startsWith('fallback-')) {
      router.push("/marketplace")
      return
    }
    if (!isAuthenticated) {
      router.push("/signup?role=buyer")
      return
    }
    router.push(`/checkout/${poolId}`)
  }

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } }

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.02]" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pact-green">Live</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Active Pools
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse pooled buys and save up to 40% on market prices with pooling power.
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline">View All Pools</Button>
          </Link>
        </div>

        {/* Pools Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-pact-green" />
          </div>
        ) : (
          <motion.div
            {...revealProps}
            variants={staggerContainerVariants}
            className="grid gap-6 md:grid-cols-3"
          >
            {pools.map((pool) => {
              const totalUnits = Math.floor(pool.overallQuantity / pool.unitQuantityValue)
              const remainingUnits = totalUnits - pool.unitsCommitted
              const progressPercent = totalUnits > 0 ? Math.round((pool.unitsCommitted / totalUnits) * 100) : 0

              return (
                <motion.div key={pool.id} variants={staggerItemVariants}>
                  <Card interactive className="overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 w-full">
                      <Image
                        src=                      {pool.image}
                        alt={pool.produceName}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      {pool.isFallback && (
                        <div className="absolute right-2 top-2">
                          <Badge variant="secondary" className="text-xs">Example</Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="text-lg">{pool.produceName}</CardTitle>
                      <CardDescription className="text-xs">
                        by {pool.farmerName} &bull; {pool.farmerLocation}
                      </CardDescription>
                      <div className="pt-1">
                        <span className="font-heading text-lg font-semibold text-foreground tabular-nums">
                          ₦{pool.pricePerUnit.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground"> / {pool.unitQuantity}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pb-5">
                      {/* Stats */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Available</span>
                          <span className="font-medium tabular-nums">{totalUnits} units</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Committed</span>
                          <span className="font-medium tabular-nums">{pool.unitsCommitted} units</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium text-pact-green tabular-nums">{remainingUnits} units</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <Progress value={progressPercent} className="h-2" />

                      {/* CTA Button */}
                      <Button 
                        onClick={() => handleJoinPool(pool.id)}
                        className="w-full"
                      >
                        {pool.isFallback ? 'Browse Marketplace' : 'Join Pool'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}
