/**
 * Farmer Bank Accounts API
 * POST /api/farmer/bank-accounts - Add a new bank account
 * GET /api/farmer/bank-accounts - List bank accounts
 * DELETE /api/farmer/bank-accounts - Remove a bank account
 */

import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError, apiForbidden } from '@/lib/api/responses'
import { resolveBankAccount, createTransferRecipient } from '@/lib/payments/transfers'

const NIGERIAN_BANKS: Record<string, string> = {
  '044': 'Access Bank',
  '023': 'Citibank Nigeria',
  '063': 'Diamond Bank',
  '050': 'Ecobank Nigeria',
  '084': 'Enterprise Bank',
  '070': 'Fidelity Bank',
  '011': 'First Bank of Nigeria',
  '214': 'First City Monument Bank',
  '058': 'Guaranty Trust Bank',
  '030': 'Heritage Bank',
  '301': 'Jaiz Bank',
  '082': 'Keystone Bank',
  '014': 'Mainstreet Bank',
  '076': 'Polaris Bank',
  '039': 'Stanbic IBTC Bank',
  '232': 'Sterling Bank',
  '032': 'Union Bank of Nigeria',
  '033': 'United Bank for Africa',
  '215': 'Unity Bank',
  '035': 'Wema Bank',
  '057': 'Zenith Bank',
}

const addAccountSchema = z.object({
  bankCode: z.string().length(3, 'Invalid bank code'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
})

/**
 * Add a new bank account
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    // Verify user is a farmer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'farmer') {
      return apiForbidden('Only farmers can add bank accounts')
    }

    const body = await request.json()
    const result = addAccountSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(result.error.errors[0].message)
    }

    const { bankCode, accountNumber } = result.data

    // Verify account with Paystack
    const resolveResult = await resolveBankAccount(accountNumber, bankCode)

    if (!resolveResult.status || !resolveResult.data?.account_name) {
      return apiBadRequest('Could not verify bank account. Please check the details.')
    }

    const accountName = resolveResult.data.account_name
    const bankName = NIGERIAN_BANKS[bankCode] || 'Unknown Bank'

    // Check if this account already exists
    const { data: existing } = await supabase
      .from('farmer_bank_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('bank_code', bankCode)
      .eq('account_number', accountNumber)
      .single()

    if (existing) {
      return apiBadRequest('This bank account is already registered')
    }

    // Create Paystack transfer recipient
    const recipientResult = await createTransferRecipient({
      name: accountName,
      bank_code: bankCode,
      account_number: accountNumber,
    })

    const recipientCode = recipientResult?.data?.recipient_code || null

    // Check if user has any existing accounts
    const { count } = await supabase
      .from('farmer_bank_accounts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    const isFirstAccount = (count || 0) === 0

    // Insert the bank account
    const { data: newAccount, error } = await supabase
      .from('farmer_bank_accounts')
      .insert({
        user_id: user.id,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        recipient_code: recipientCode,
        is_default: isFirstAccount,
        is_verified: true,
      })
      .select()
      .single()

    if (error) {
      return apiInternalError()
    }

    return apiSuccess({
      account: newAccount,
      message: 'Bank account added successfully',
    })
  } catch {
    return apiInternalError()
  }
}

/**
 * List bank accounts for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const { data: accounts, error } = await supabase
      .from('farmer_bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })

    if (error) {
      return apiInternalError()
    }

    return apiSuccess({ accounts: accounts || [] })
  } catch {
    return apiInternalError()
  }
}

/**
 * Delete a bank account
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiUnauthorized()
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return apiBadRequest('Account ID is required')
    }

    // Verify ownership
    const { data: account } = await supabase
      .from('farmer_bank_accounts')
      .select('id, is_default')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return apiBadRequest('Bank account not found')
    }

    // Don't allow deleting the default account if it's the only one
    if (account.is_default) {
      const { count } = await supabase
        .from('farmer_bank_accounts')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)

      if ((count || 0) <= 1) {
        return apiBadRequest('Cannot delete your only bank account')
      }
    }

    const { error } = await supabase
      .from('farmer_bank_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (error) {
      return apiInternalError()
    }

    return apiSuccess({ deleted: true })
  } catch {
    return apiInternalError()
  }
}
