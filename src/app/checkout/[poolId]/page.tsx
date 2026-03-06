'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { slideUpVariants, transitions } from '@/lib/animations'
import { toast } from 'sonner'

interface PoolData {
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

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const poolId = params.poolId as string
  const supabase = createClient()

  const [pool, setPool] = useState<PoolData | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  const fetchPoolData = useCallback(async () => {
    try {
      // Fetch real pool data from database
      const { data: poolData, error: poolError } = await supabase
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
        .eq('id', poolId)
        .eq('status', 'active')
        .single()

      if (poolError || !poolData) {
        return null
      }

      const dbPool = poolData as unknown as DbPool
      const listing = dbPool.listing

      if (!listing) {
        return null
      }

      // Transform database data to PoolData format
      const farmer = listing.farmer
      const unitValue = parseUnitValue(listing.unit)
      const totalUnits = Math.floor(listing.quantity / unitValue)
      const committedUnits = Math.floor((dbPool.current_quantity || 0) / unitValue)

      const transformedPool: PoolData = {
        id: dbPool.id,
        produceName: listing.name,
        pricePerUnit: listing.price_per_unit,
        unitQuantity: listing.unit,
        farmerName: farmer?.display_name || 'Unknown Farm',
        farmerLocation: farmer?.location || 'Unknown Location',
        overallQuantity: listing.quantity,
        unitQuantityValue: unitValue,
        unitsCommitted: committedUnits,
        image: listing.image_url || '/images/placeholder-produce.jpg'
      }

      return transformedPool
    } catch {
      return null
    }
  }, [supabase, poolId])

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Check authentication
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/signup?role=buyer')
          return
        }
        setUser({ id: authUser.id, email: authUser.email })

        // Fetch real pool data
        const poolData = await fetchPoolData()
        if (!poolData) {
          toast.error('Pool not found or no longer active')
          router.push('/marketplace')
          return
        }
        setPool(poolData)
      } catch {
        toast.error('Failed to load checkout')
        router.push('/marketplace')
      } finally {
        setIsLoading(false)
      }
    }

    initializeCheckout()
  }, [poolId, router, supabase, fetchPoolData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Pool not found</h2>
          <p className="text-muted-foreground mt-2">This pool may no longer be active.</p>
          <Link href="/marketplace">
            <Button className="mt-4">Browse Active Pools</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalUnits = Math.floor(pool.overallQuantity / pool.unitQuantityValue)
  const remainingUnits = totalUnits - pool.unitsCommitted
  const maxQuantity = Math.max(1, remainingUnits)
  const totalPrice = quantity * pool.pricePerUnit
  const progressPercent = totalUnits > 0 ? (pool.unitsCommitted / totalUnits) * 100 : 0

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncrement = () => {
    if (quantity < maxQuantity) setQuantity(quantity + 1)
  }

  const handleProceedToPayment = async () => {
    if (quantity < 1 || quantity > maxQuantity) {
      toast.error('Invalid quantity selected')
      return
    }

    setIsProcessing(true)
    try {
      // Initiate payment via server API
      const res = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          quantity,
          pricePerUnit: pool.pricePerUnit
        })
      })

      const data = await res.json()
      if (!data.success) {
        const errorMsg = data.error || 'Failed to initialize payment'
        // Show specific error for capacity issues
        if (errorMsg.toLowerCase().includes('capacity') || errorMsg.toLowerCase().includes('insufficient')) {
          toast.error('Pool is full or insufficient capacity remaining', { 
            description: 'Please reduce your quantity or try another pool.',
            duration: 5000
          })
        } else {
          toast.error(errorMsg)
        }
        return
      }

      toast.success('Redirecting to payment...')
      window.location.href = data.authorizationUrl
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process checkout'
      if (errorMsg.toLowerCase().includes('capacity') || errorMsg.toLowerCase().includes('insufficient')) {
        toast.error('Pool capacity exceeded', { 
          description: 'Please reduce your quantity or try another pool.',
          duration: 5000
        })
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <Link href="/marketplace" className="flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to pools
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideUpVariants}
          transition={transitions.normal}
        >
          {/* Pool Details Card */}
          <Card className="overflow-hidden rounded-2xl border-border shadow-lg mb-6">
            <div className="relative h-64 w-full">
              <Image
                src={pool.image}
                alt={pool.produceName}
                fill
                className="object-cover"
              />
            </div>

            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-3xl mb-2">{pool.produceName}</CardTitle>
                <CardDescription className="text-base">
                  by {pool.farmerName} • {pool.farmerLocation}
                </CardDescription>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Price per unit</span>
                  <span className="text-2xl font-bold text-foreground">₦{pool.pricePerUnit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Unit size</span>
                  <span className="font-medium text-foreground">{pool.unitQuantity}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pool Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pool Progress</span>
                  <span className="font-medium">
                    {pool.unitsCommitted} / {totalUnits} units
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-pact-green"
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{remainingUnits} units remaining</span>
                  <span>{Math.round(progressPercent)}% filled</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity to buy
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Min: 1 • Max: {maxQuantity}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isProcessing}
                    className="h-10 w-10"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="flex-1">
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => {
                        const val = Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1))
                        setQuantity(val)
                      }}
                      min="1"
                      max={maxQuantity}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-center font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-pact-green"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={quantity >= maxQuantity || isProcessing}
                    className="h-10 w-10"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-2 pt-6 border-t border-border bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal ({quantity} units)</span>
                  <span className="font-medium">₦{(quantity * pool.pricePerUnit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform fee (2.5%)</span>
                  <span className="font-medium">₦{Math.round(totalPrice * 0.025).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-2 mt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-pact-green">
                    ₦{Math.round(totalPrice * 1.025).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Warning if pool is almost full */}
              {remainingUnits < 5 && remainingUnits > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-700 bg-amber-100">
                    Filling fast
                  </Badge>
                  <span className="text-sm text-amber-700 dark:text-amber-200">
                    Only {remainingUnits} units left! Hurry to secure yours.
                  </span>
                </div>
              )}

              {/* Warning if pool is full */}
              {remainingUnits <= 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-red-700 bg-red-100">
                    Pool Full
                  </Badge>
                  <span className="text-sm text-red-700 dark:text-red-200">
                    This pool has reached its capacity. Browse other active pools.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-6">
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing || quantity < 1 || quantity > maxQuantity || remainingUnits <= 0}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Proceed to Payment • ₦${Math.round(totalPrice * 1.025).toLocaleString()}`
                  )}
                </Button>
                <Link href="/marketplace">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base"
                    disabled={isProcessing}
                  >
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <span>Secure payment</span>
                <span>Verified farmer</span>
                <span>Instant confirmation</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Parse the numeric value from a unit string (e.g., "50kg basket" -> 50)
 */
function parseUnitValue(unit: string): number {
  const match = unit.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}
