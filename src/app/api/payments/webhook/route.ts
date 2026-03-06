import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paystackClient } from '@/lib/payments/paystack-client';
import { ChargebackService } from '@/services/chargeback.service';
import { z } from 'zod';

import type { SupabaseClient } from '@supabase/supabase-js';

// Zod schema for webhook event validation
const webhookEventSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string().optional(),
    gateway_response: z.string().optional(),
    reason: z.string().optional(),
  }).passthrough(),
}).passthrough();

interface PoolJoinMetadata {
  type: 'pool_join';
  poolId: string;
  userId: string;
  quantity?: number;
}

/**
 * Check if metadata represents a pool join payment
 */
function isPoolJoinMetadata(meta: unknown): meta is PoolJoinMetadata {
  if (!meta || typeof meta !== 'object') return false;
  const m = meta as Record<string, unknown>;
  return m.type === 'pool_join' && Boolean(m.poolId) && Boolean(m.userId);
}

/**
 * Handle pool member payment authorization
 * Idempotently updates pool_members to authorized and increments pool quantity
 */
async function handlePoolJoinPayment(
  admin: SupabaseClient,
  meta: PoolJoinMetadata,
  amountNaira: number,
  reference: string
): Promise<void> {
  const poolId = String(meta.poolId);
  const userId = String(meta.userId);
  const quantity = Number(meta.quantity) || 0;

  const { data: member, error: memberError } = await admin
    .from('pool_members')
    .select('payment_status')
    .eq('pool_id', poolId)
    .eq('user_id', userId)
    .single();

  if (memberError || !member) return;

  // Already authorized - skip (idempotent)
  const memberData = member as { payment_status: string };
  if (memberData.payment_status === 'authorized') return;

  // Update status and amount/reference
  await admin
    .from('pool_members')
    .update({ 
      payment_status: 'authorized', 
      amount_pledged: amountNaira, 
      payment_reference: reference 
    } as never)
    .eq('pool_id', poolId)
    .eq('user_id', userId);

  // Increment pool current_quantity if quantity > 0
  if (quantity > 0) {
    await admin.rpc('increment_pool_quantity' as never, { 
      pool_id_param: poolId, 
      quantity_param: quantity 
    } as never);
  }
}

/**
 * Handle successful charge event
 * Verifies payment and processes pool join if applicable
 */
async function handleChargeSuccess(admin: SupabaseClient, reference: string): Promise<void> {
  const verificationResult = await paystackClient.verifyPayment(reference);

  // Early return if verification failed
  if (!verificationResult.status || verificationResult.data.status !== 'success') {
    return;
  }

  // Handle general payments (legacy)
  try { 
    await paystackClient.processSuccessfulPayment(verificationResult); 
  } catch {
    // Silent fail for legacy payment processing
  }

  // Check for pool join metadata
  const meta = verificationResult.data?.metadata;
  if (!isPoolJoinMetadata(meta)) {
    return;
  }

  // Process pool join payment
  const amountNaira = (verificationResult.data.amount || 0) / 100;
  await handlePoolJoinPayment(admin, meta, amountNaira, verificationResult.data.reference);
}

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const crypto = require('crypto');
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) return false;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  return hash === signature;
}

/**
 * Log webhook event to database for audit trail and replay capability
 */
async function logWebhookEvent(
  admin: SupabaseClient,
  eventType: string,
  payload: unknown,
  reference?: string
): Promise<void> {
  try {
    await admin
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        source: 'paystack',
        payload: payload as never,
        reference: reference || null,
        status: 'processed',
        processed_at: new Date().toISOString(),
      });
  } catch {
    // Silent fail - don't block webhook processing for logging failure
  }
}

/**
 * Handle Paystack webhook for payment verification
 * POST /api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyPaystackSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const validationResult = webhookEventSchema.safeParse(event);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    // Use admin client for webhook reconciliation (bypass RLS)
    const admin = createAdminClient();
    paystackClient.setSupabase(admin as Parameters<typeof paystackClient.setSupabase>[0]);

    switch (event.event) {
      case 'charge.success':
        await logWebhookEvent(admin, 'charge.success', event, event.data.reference);
        await handleChargeSuccess(admin, event.data.reference);
        break;

      case 'charge.failed':
        await logWebhookEvent(admin, 'charge.failed', event, event.data.reference);
        await paystackClient.handlePaymentFailure(event.data.reference);
        break;

      case 'transfer.success': {
        await logWebhookEvent(admin, 'transfer.success', event, event.data.reference);
        const { reference, transfer_code, recipient_code } = event.data;
        await admin
          .from('payouts')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            transfer_code,
            recipient_code,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('reference', reference);
        break;
      }

      case 'transfer.failed': {
        await logWebhookEvent(admin, 'transfer.failed', event, event.data.reference);
        const { reference, reason } = event.data;
        await admin
          .from('payouts')
          .update({
            status: 'failed',
            failure_reason: reason || 'Transfer failed',
            updated_at: new Date().toISOString(),
          } as never)
          .eq('reference', reference);
        break;
      }

      // Handle Paystack dispute events
      case 'dispute.create':
      case 'dispute.reminder':
      case 'dispute.resolve': {
        await logWebhookEvent(admin, event.event, event, event.data.transaction?.reference);
        const chargebackService = new ChargebackService(admin);
        await chargebackService.handleDisputeWebhook(event);
        break;
      }

      default:
        // Log unhandled event type
        await logWebhookEvent(admin, event.event, event, event.data?.reference);
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
