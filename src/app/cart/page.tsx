'use client'

import { 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  Loader2,
  Package
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { AnimatedListItem, AnimatedPageContent, AnimatePresence } from '@/components/AnimatedList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'


interface CartItem {
  id: string
  pool_id: string
  quantity: number
  price_per_unit: number
  pool: {
    id: string
    status: string
    listing: {
      name: string
      unit: string
      image_url: string | null
      farmer: {
        display_name: string | null
      } | null
    } | null
  } | null
}

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())

  const fetchCartItems = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch cart items (pending pool memberships)
      const { data, error } = await supabase
        .from('pool_members')
        .select(`
          pool_id,
          user_id,
          quantity_pledged,
          pool:pools(
            id,
            status,
            listing:listings(
              name,
              unit,
              price_per_unit,
              image_url,
              farmer:profiles!listings_farmer_id_fkey(display_name)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .order('joined_at', { ascending: false })

      if (error) {
        toast.error('Failed to load cart')
        return
      }

      // Transform data
      interface DbCartItem {
        pool_id: string
        user_id: string
        quantity_pledged: number | null
        pool: CartItem['pool'] | null
      }
      const items: CartItem[] = (data as unknown as DbCartItem[] || []).map((item: DbCartItem) => {
        const pool = item.pool as CartItem['pool']
        const listing = pool?.listing as { name: string; unit: string; price_per_unit: number; image_url: string | null; farmer: { display_name: string | null } | null } | null
        return {
          id: item.pool_id,
          pool_id: item.pool_id,
          quantity: item.quantity_pledged || 1,
          price_per_unit: listing?.price_per_unit || 0,
          pool: pool ? {
            id: pool.id,
            status: pool.status,
            listing: listing ? {
              name: listing.name,
              unit: listing.unit,
              image_url: listing.image_url,
              farmer: listing.farmer
            } : null
          } : null
        }
      })

      setCartItems(items)
    } catch {
      toast.error('Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchCartItems()
  }, [fetchCartItems])

  const removeFromCart = async (itemId: string) => {
    setProcessingItems(prev => new Set(prev).add(itemId))

    try {
      const { error } = await supabase
        .from('pool_members')
        .delete()
        .eq('pool_id', itemId)

      if (error) {
        toast.error('Failed to remove item')
        return
      }

      setCartItems(prev => prev.filter(item => item.id !== itemId))
      toast.success('Item removed from cart')
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setProcessingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const proceedToCheckout = (poolId: string) => {
    router.push(`/checkout/${poolId}`)
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.quantity * item.price_per_unit),
    0
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AnimatedPageContent>
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Your Cart</h1>
            <p className="text-muted-foreground mt-1">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">Your cart is empty</CardTitle>
              <CardDescription className="text-center mb-6 max-w-sm">
                Looks like you have not added any pools to your cart yet. 
                Browse our marketplace to find great deals on fresh produce.
              </CardDescription>
              <Link href="/marketplace">
                <Button>
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
              {cartItems.map((item) => {
                const listing = item.pool?.listing
                const isProcessing = processingItems.has(item.id)

                return (
                  <AnimatedListItem key={item.id} layoutId={item.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {listing?.image_url ? (
                            <Image
                              src={listing.image_url}
                              alt={listing.name || 'Product'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {listing?.name || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {listing?.farmer?.display_name || 'Unknown Farm'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.quantity} x {listing?.unit || 'unit'}
                          </p>
                          <p className="text-lg font-bold text-pact-green mt-2">
                            ₦{(item.quantity * item.price_per_unit).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isProcessing}
                            className="text-muted-foreground hover:text-red-600"
                            aria-label="Remove from cart"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => proceedToCheckout(item.pool_id)}
                            disabled={isProcessing}
                          >
                            Checkout
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </AnimatedListItem>
                )
              })}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[60%]">
                          {item.pool?.listing?.name || 'Item'} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          ₦{(item.quantity * item.price_per_unit).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Platform fee (2.5%)</span>
                      <span className="font-medium">₦{Math.round(totalAmount * 0.025).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-pact-green">
                        ₦{Math.round(totalAmount * 1.025).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Each pool item must be checked out separately
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
    </AnimatedPageContent>
  )
}
