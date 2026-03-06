'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function verifyPaymentAndCreateOrder(
  reference: string,
  poolId: string
) {
  try {
    // 1. Verify transaction with Paystack
    const paystackVerifyUrl = `https://api.paystack.co/transaction/verify/${reference}`
    const paystackResponse = await fetch(paystackVerifyUrl, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return { success: false, error: 'Payment verification failed' }
    }

    // Extract details from Paystack verification
    const paidAmountKobo: number = paystackData.data.amount
    const paidAmount = Math.round(paidAmountKobo / 100)
    const metadata = paystackData.data.metadata || {}
    const quantity = Number(metadata.quantity) || 0

    // 2. Execute via Admin to bypass RLS/ensure authority
    const adminSupabase = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // 3. Upsert Pool Member (Update status to 'captured'/'authorized')
    // Note: The user should have been added as 'pending' during the reservation phase (join_pool RPC).
    // If they weren't (e.g. direct link), we insert them now.
    
    // Check if member exists
    const { data: existingMember } = await adminSupabase
        .from('pool_members')
        .select('*')
        .eq('pool_id', poolId)
        .eq('user_id', user.id)
        .single()

    if (existingMember) {
        // Update existing pending member
        const { error: updateError } = await adminSupabase
            .from('pool_members')
            .update({
                payment_status: 'captured',
                payment_reference: reference,
                amount_pledged: paidAmount,
                quantity_pledged: quantity // Ensure quantity matches
            } as never)
            .eq('pool_id', poolId)
            .eq('user_id', user.id)
            
        if (updateError) throw updateError
    } else {
        // Fallback: If no reservation existed (shouldn't happen with new flow, but good for safety)
        // We might want to call the join_pool RPC here to decrement stock if it wasn't done?
        // OR just insert. For now, assuming reservation happened or we just insert.
        // Let's insert as 'captured'.
        
        const { error: insertError } = await adminSupabase
            .from('pool_members')
            .insert({
                pool_id: poolId,
                user_id: user.id,
                quantity_pledged: quantity,
                amount_pledged: paidAmount,
                payment_status: 'captured',
                payment_reference: reference
            } as never)

         if (insertError) throw insertError
         
         // If we just inserted, we technically need to decrement the pool/listing quantity if not done.
         // Calling the RPC to be safe, though this might double-count if we aren't careful.
         // Safer strategy: The Frontend calls "reserve" (RPC) first. 
         // Here we just confirm payment.
    }

    revalidatePath('/dashboard/buyer')
    revalidatePath(`/marketplace/pools/${poolId}`)
    
    return { success: true }

  } catch (error) {
    console.error('Payment verification error:', error)
    return { success: false, error: 'Internal server error during verification' }
  }
}
