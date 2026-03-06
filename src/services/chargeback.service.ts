/**
 * Chargeback Service
 * Handles Paystack dispute/chargeback management
 */

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ChargebackStatus = 
  | 'open'
  | 'awaiting_response'
  | 'under_review'
  | 'resolved_won'
  | 'resolved_lost'
  | 'refunded'

export interface Chargeback {
  id: string
  order_id: string | null
  pool_member_id: string | null
  paystack_dispute_id: string | null
  payment_reference: string
  amount: number // kobo
  currency: string
  reason: string | null
  status: ChargebackStatus
  evidence: Record<string, unknown>
  due_date: string | null
  resolved_at: string | null
  outcome: string | null
  admin_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChargebackEvidence {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  transaction_description?: string
  delivery_date?: string
  delivery_address?: string
  delivery_confirmation?: string // URL to proof of delivery
  additional_notes?: string
  supporting_documents?: string[] // URLs
}

export interface CreateChargebackInput {
  orderId?: string
  poolMemberId?: string
  paystackDisputeId?: string
  paymentReference: string
  amount: number
  reason?: string
  dueDate?: string
}

export interface UpdateChargebackInput {
  status?: ChargebackStatus
  evidence?: ChargebackEvidence
  adminNotes?: string
  outcome?: string
}

export class ChargebackService {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Create a new chargeback record
   */
  async createChargeback(
    input: CreateChargebackInput,
    createdBy?: string
  ): Promise<{ success: boolean; data?: Chargeback; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('chargebacks')
        .insert({
          order_id: input.orderId || null,
          pool_member_id: input.poolMemberId || null,
          paystack_dispute_id: input.paystackDisputeId || null,
          payment_reference: input.paymentReference,
          amount: input.amount,
          reason: input.reason || null,
          due_date: input.dueDate || null,
          status: 'open',
          created_by: createdBy || null,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Chargeback }
    } catch (err) {
      return { success: false, error: 'Failed to create chargeback' }
    }
  }

  /**
   * Get chargeback by ID
   */
  async getChargeback(id: string): Promise<Chargeback | null> {
    const { data } = await this.supabase
      .from('chargebacks')
      .select('*')
      .eq('id', id)
      .single()

    return data as Chargeback | null
  }

  /**
   * Get chargeback by Paystack dispute ID
   */
  async getChargebackByDisputeId(paystackDisputeId: string): Promise<Chargeback | null> {
    const { data } = await this.supabase
      .from('chargebacks')
      .select('*')
      .eq('paystack_dispute_id', paystackDisputeId)
      .single()

    return data as Chargeback | null
  }

  /**
   * List chargebacks with pagination
   */
  async listChargebacks(options: {
    status?: ChargebackStatus
    limit?: number
    offset?: number
  } = {}): Promise<{ data: Chargeback[]; count: number }> {
    const { status, limit = 20, offset = 0 } = options

    let query = this.supabase
      .from('chargebacks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, count } = await query

    return {
      data: (data as Chargeback[]) || [],
      count: count || 0,
    }
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: 'won' | 'lost',
    notes?: string
  ): Promise<{ success: boolean; data?: Chargeback; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('chargebacks')
        .update({
          status: resolution === 'won' ? 'resolved_won' : 'resolved_lost',
          outcome: resolution,
          admin_notes: notes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Chargeback }
    } catch {
      return { success: false, error: 'Failed to resolve dispute' }
    }
  }

  /**
   * Update chargeback
   */
  async updateChargeback(
    id: string,
    input: UpdateChargebackInput
  ): Promise<{ success: boolean; data?: Chargeback; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (input.status) {
        updateData.status = input.status
        
        // Set resolved_at for resolved statuses
        if (input.status.startsWith('resolved_') || input.status === 'refunded') {
          updateData.resolved_at = new Date().toISOString()
        }
      }

      if (input.evidence) {
        updateData.evidence = input.evidence
      }

      if (input.adminNotes) {
        updateData.admin_notes = input.adminNotes
      }

      if (input.outcome) {
        updateData.outcome = input.outcome
      }

      const { data, error } = await this.supabase
        .from('chargebacks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Chargeback }
    } catch {
      return { success: false, error: 'Failed to update chargeback' }
    }
  }

  /**
   * Submit evidence for a chargeback
   */
  async submitEvidence(
    id: string,
    evidence: ChargebackEvidence
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.updateChargeback(id, {
      evidence,
      status: 'awaiting_response',
    })

    return { success: result.success, error: result.error }
  }

  /**
   * Process refund for a chargeback (mark as refunded)
   */
  async processRefund(
    id: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.updateChargeback(id, {
      status: 'refunded',
      outcome: 'refunded',
      adminNotes: adminNotes || 'Refund processed',
    })

    return { success: result.success, error: result.error }
  }

  /**
   * Handle Paystack dispute webhook event
   */
  async handleDisputeWebhook(event: {
    event: string
    data: {
      id: string
      refund_amount: number
      currency: string
      status: string
      resolution?: string
      message?: string
      merchant_transaction_reference?: string
      transaction?: {
        reference: string
        amount: number
      }
      due_date?: string
      reason?: string
    }
  }): Promise<{ success: boolean; error?: string }> {
    const { data } = event

    // Map Paystack status to our status
    const statusMap: Record<string, ChargebackStatus> = {
      pending: 'open',
      awaiting_response: 'awaiting_response',
      awaiting_merchant: 'awaiting_response',
      awaiting_bank: 'under_review',
      resolved: data.resolution === 'merchant' ? 'resolved_won' : 'resolved_lost',
    }

    const status = statusMap[data.status] || 'open'
    const reference = data.transaction?.reference || data.merchant_transaction_reference || ''

    // Check if chargeback exists
    const existing = await this.getChargebackByDisputeId(data.id.toString())

    if (existing) {
      // Update existing chargeback
      await this.updateChargeback(existing.id, {
        status,
        outcome: data.resolution || undefined,
      })
    } else {
      // Create new chargeback from webhook
      await this.createChargeback({
        paystackDisputeId: data.id.toString(),
        paymentReference: reference,
        amount: data.refund_amount || data.transaction?.amount || 0,
        reason: data.reason || data.message || 'Paystack dispute',
        dueDate: data.due_date,
      })
    }

    return { success: true }
  }

  /**
   * Get chargeback statistics
   */
  async getStats(): Promise<{
    total: number
    open: number
    resolved: number
    wonRate: number
    totalAmount: number
  }> {
    const { data: chargebacks } = await this.supabase
      .from('chargebacks')
      .select('status, amount')

    if (!chargebacks || chargebacks.length === 0) {
      return { total: 0, open: 0, resolved: 0, wonRate: 0, totalAmount: 0 }
    }

    const total = chargebacks.length
    const open = chargebacks.filter((c) => 
      ['open', 'awaiting_response', 'under_review'].includes(c.status)
    ).length
    const resolved = chargebacks.filter((c) => 
      c.status.startsWith('resolved_') || c.status === 'refunded'
    ).length
    const won = chargebacks.filter((c) => c.status === 'resolved_won').length
    const wonRate = resolved > 0 ? (won / resolved) * 100 : 0
    const totalAmount = chargebacks.reduce((sum, c) => sum + (c.amount || 0), 0)

    return { total, open, resolved, wonRate, totalAmount }
  }
}
