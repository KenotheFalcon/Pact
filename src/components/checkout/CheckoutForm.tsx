'use client'

import { createBrowserClient } from '@supabase/ssr'
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { useState, useMemo } from 'react'
import { toast } from "sonner"

import { verifyPaymentAndCreateOrder } from '@/app/checkout/actions'
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"


interface Pool {
    id: string
    min_quantity: number
    current_quantity: number
    expires_at: string
    status: string
    listing: {
        id: string
        name: string
        price_per_unit: number
        unit: string
        quantity: number
        images: string[]
    }
}

interface CheckoutFormProps {
    pool: Pool
    poolId: string
}

/**
 * Client Component: Handles Paystack payment form
 * Isolated from server data fetching to maintain client boundary
 */
export function CheckoutForm({ pool, poolId }: CheckoutFormProps) {
    const [loading, setLoading] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Calculate available quantity
    const availableQuantity = pool.listing.quantity - pool.current_quantity
    const minQuantity = 1
    const maxQuantity = Math.max(availableQuantity, 1)

    // Validation state
    const validation = useMemo(() => {
        if (quantity < minQuantity) {
            return { valid: false, message: `Minimum quantity is ${minQuantity}` }
        }
        if (quantity > maxQuantity) {
            return { valid: false, message: `Only ${maxQuantity} ${pool.listing.unit}(s) available` }
        }
        if (availableQuantity <= 0) {
            return { valid: false, message: 'This pool is fully committed' }
        }
        return { valid: true, message: null }
    }, [quantity, minQuantity, maxQuantity, availableQuantity, pool.listing.unit])

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        if (isNaN(value) || value < 1) {
            setQuantity(1)
        } else {
            setQuantity(value)
        }
    }

    const handlePayment = async () => {
        if (!validation.valid) {
            toast.error(validation.message || 'Invalid quantity')
            return
        }

        setLoading(true)

        try {
            // Get current user (should be logged in from parent check)
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push(`/login?next=/checkout/${poolId}`)
                return
            }

            // 1. Reserve Spot via RPC
            // Safe to call from client because RPC has RLS + Security Definer
            const { error: reservationError } = await supabase.rpc('join_pool', {
                p_pool_id: pool.id,
                p_user_id: user.id,
                p_quantity: quantity
            })

            if (reservationError) {
                toast.error(reservationError.message || "Failed to reserve spot. Pool might be full.")
                setLoading(false)
                return
            }

            toast.success("Spot reserved! Initializing payment…")

            // 2. Initialize Paystack
            const amount = pool.listing.price_per_unit * quantity
            const paystack = new (window as unknown as { PaystackPop: new () => { newTransaction: (options: unknown) => void } }).PaystackPop()

            paystack.newTransaction({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                email: user.email,
                amount: amount * 100, // Paystack expects amount in kobo
                currency: 'NGN',
                ref: crypto.randomUUID(),
                callback: async function (response: { reference: string }) {
                    // 3. Verify on Server
                    toast.info("Verifying payment…")
                    const result = await verifyPaymentAndCreateOrder(
                        response.reference,
                        pool.id
                    )

                    if (!result.success) {
                        toast.error(result.error || "Payment verification failed")
                    } else {
                        toast.success("Order placed successfully!")
                        router.push('/dashboard/buyer')
                    }
                    setLoading(false)
                },
                onClose: function () {
                    // Note: Spot is reserved even if payment cancelled
                    // Cleanup mechanism or cron job could be implemented
                    setLoading(false)
                    toast.info("Payment cancelled")
                }
            })

        } catch {
            toast.error("Something went wrong")
            setLoading(false)
        }
    }

    const totalPrice = pool.listing.price_per_unit * quantity

    return (
        <>
            <Script src="https://js.paystack.co/v1/inline.js" />

            <CardContent className="space-y-6">
                {/* Product Details */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex-1">
                        <p className="font-heading font-semibold text-lg">{pool.listing.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            ₦{pool.listing.price_per_unit.toLocaleString()} / {pool.listing.unit}
                        </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={pool.listing.images?.[0] || "/images/placeholder.svg"}
                        alt={pool.listing.name}
                        className="h-20 w-20 object-cover rounded-xl flex-shrink-0 border border-border"
                    />
                </div>

                {/* Pool Status */}
                <div className="flex items-center justify-between p-3 bg-pact-green/10 rounded-lg border border-pact-green/20">
                    <span className="text-sm text-pact-green font-medium">Available in pool</span>
                    <span className="text-sm font-semibold text-pact-green">
                        {availableQuantity} {pool.listing.unit}(s)
                    </span>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="quantity" className="text-base font-medium">
                            Quantity ({pool.listing.unit}s)
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            Min: {minQuantity} | Max: {maxQuantity}
                        </span>
                    </div>
                    <Input
                        id="quantity"
                        type="number"
                        min={minQuantity}
                        max={maxQuantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                        disabled={loading || availableQuantity <= 0}
                        className={`h-12 rounded-xl text-lg font-semibold ${
                            !validation.valid 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'focus:ring-pact-green'
                        }`}
                    />
                    {/* Validation Feedback */}
                    {!validation.valid && validation.message && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{validation.message}</span>
                        </div>
                    )}
                    {validation.valid && quantity > 0 && (
                        <div className="flex items-center gap-2 text-pact-green text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{quantity} {pool.listing.unit}(s) selected</span>
                        </div>
                    )}
                </div>

                {/* Total Price */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t border-border">
                    <span className="font-heading font-bold text-lg">Total Amount</span>
                    <span className="font-heading font-bold text-3xl text-pact-green">
                        ₦{totalPrice.toLocaleString()}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <LoadingButton
                    className="w-full bg-pact-green hover:bg-pact-green/90 h-14 text-lg rounded-xl"
                    size="lg"
                    onClick={handlePayment}
                    loading={loading}
                    loadingText="Processing…"
                    icon={CreditCard}
                    disabled={!validation.valid || availableQuantity <= 0}
                >
                    Pay Now
                </LoadingButton>
            </CardFooter>
        </>
    )
}
