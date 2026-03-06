import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePaymentReference, toKobo } from '@/lib/payments/paystack'
import { PAYSTACK_API_BASE_URL } from '@/lib/constants/paystack'
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from '@/lib/api/responses'

// Request validation schema
const PaymentInitSchema = z.object({
  poolId: z.string().uuid("Invalid pool ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
})

interface PoolWithListing {
  min_quantity: number
  listing: { price_per_unit: number; quantity: number } | { price_per_unit: number; quantity: number }[]
}

/**
 * Extract price per unit from pool listing data
 * Returns null if pricing is invalid
 */
function extractPricePerUnit(poolData: PoolWithListing): number | null {
  const listing = Array.isArray(poolData.listing) ? poolData.listing[0] : poolData.listing
  if (!listing) return null
  
  const price = Number(listing.price_per_unit)
  return !price || Number.isNaN(price) ? null : price
}

/**
 * Initialize payment for pool membership
 * POST /api/payments/init
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request body
    const parseResult = PaymentInitSchema.safeParse(body)
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0]?.message || "Invalid request")
    }
    const { poolId, quantity } = parseResult.data

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return apiUnauthorized()
    }

    // Fetch trusted pricing and capacity context from DB
    const { data: poolData, error: poolError } = await adminSupabase
      .from('pools')
      .select('min_quantity, listing:listings(price_per_unit, quantity)')
      .eq('id', poolId)
      .single()

    if (poolError || !poolData) {
      return apiNotFound("Pool")
    }

    // Validate listing pricing
    const pricePerUnit = extractPricePerUnit(poolData as PoolWithListing)
    if (!pricePerUnit) {
      return apiInternalError("Invalid listing pricing")
    }

    const totalAmountNaira = pricePerUnit * quantity

    // Generate reference and atomically reserve capacity
    const reference = generatePaymentReference('PACT')
    const { error: reserveError } = await adminSupabase.rpc('reserve_pool_membership' as never, {
      pool_id_param: poolId,
      user_id_param: user.id,
      quantity_param: quantity,
      amount_naira: totalAmountNaira,
      reference_param: reference
    } as never)

    if (reserveError) {
      const errorMessage = (reserveError as { message?: string })?.message?.toLowerCase() || ''
      const isCapacityError = errorMessage.includes('insufficient capacity')
      return apiBadRequest(isCapacityError ? 'Pool capacity exceeded' : 'Failed to reserve capacity')
    }

    // Initialize Paystack transaction
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?poolId=${encodeURIComponent(poolId)}`

    const initRes = await fetch(`${PAYSTACK_API_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        amount: toKobo(totalAmountNaira),
        reference,
        callback_url: callbackUrl,
        metadata: {
          type: 'pool_join',
          poolId,
          userId: user.id,
          quantity,
          pricePerUnit
        }
      })
    })

    const initData = await initRes.json()
    if (!initData.status) {
      return apiInternalError("Failed to initialize payment")
    }

    return apiSuccess({
      authorizationUrl: initData.data.authorization_url,
      reference
    })
  } catch {
    return apiInternalError()
  }
}
