import { NextRequest } from "next/server";

import { PaymentService } from "@/services/payment.service";
import { createClient } from "@/lib/supabase/server";
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  getErrorMessage,
} from "@/lib/api/responses";

/**
 * Verify payment status with Paystack and update database
 * GET /api/payments/verify?reference=xxx&poolId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get("reference");
  const poolId = searchParams.get("poolId");

  if (!reference || !poolId) {
    return apiBadRequest("Missing reference or poolId");
  }

  try {
    // Verify with Paystack
    const verifyResponse = await PaymentService.verifyTransaction(reference);

    if (!verifyResponse.success) {
      return apiBadRequest("Payment verification failed at gateway");
    }

    // Atomically update payment status using RPC to prevent race conditions
    const supabase = await createClient();

    const { data: result, error: rpcError } = await supabase.rpc(
      "authorize_payment_atomically",
      {
        p_payment_reference: reference,
        p_pool_id: poolId,
      }
    );

    if (rpcError) {
      if (rpcError.message.includes("not found")) {
        return apiNotFound("Pledge");
      }
      return apiInternalError("Failed to update payment status");
    }

    // result: 'already_processed', 'authorized', or 'not_found'
    if (result === "not_found") {
      return apiNotFound("Pledge");
    }

    // Both 'already_processed' and 'authorized' are success cases
    return apiSuccess({ status: result });
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, "Verification failed"));
  }
}
