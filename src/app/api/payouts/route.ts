import { NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  createTransferRecipient,
  initiateTransfer,
  generateTransferReference,
} from "@/lib/payments/transfers";
import { 
  apiSuccess, 
  apiUnauthorized, 
  apiBadRequest, 
  apiInternalError,
  getErrorMessage 
} from "@/lib/api/responses";

// Validation schema for payout request
const PayoutRequestSchema = z.object({
  amount: z.number().positive().int().min(100, "Minimum payout is 100 kobo (₦1)"),
  bankCode: z.string().min(3).max(10),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
});

/**
 * Request a payout transfer
 * POST /api/payouts
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = PayoutRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0]?.message || "Invalid request");
    }
    const { amount, bankCode, accountNumber } = parseResult.data;

    // Verify farmer profile exists
    const { data: farmer, error: farmerError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .eq("role", "farmer")
      .single();

    if (farmerError || !farmer) {
      return apiBadRequest("Farmer profile required");
    }

    // Check available balance
    const { data: balanceRow, error: balanceError } = await supabase.rpc(
      "get_farmer_available_balance",
      { p_user_id: user.id }
    );
    if (balanceError) {
      return apiInternalError("Balance check failed");
    }

    const availableBalance = Number(balanceRow || 0);
    if (amount > availableBalance) {
      return apiBadRequest("Insufficient balance");
    }

    // Create Paystack recipient
    const recipientResp = await createTransferRecipient({
      name: farmer.display_name || "Farmer",
      bank_code: bankCode,
      account_number: accountNumber,
    });

    const recipientCode = recipientResp?.data?.recipient_code;
    if (!recipientCode) {
      return apiInternalError("Recipient creation failed");
    }

    // Initiate transfer
    const reference = generateTransferReference();
    const transferResp = await initiateTransfer({
      amount,
      recipient: recipientCode,
      reference,
    });

    // Record payout request
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        user_id: user.id,
        amount,
        reference,
        status: transferResp?.data?.status || "pending",
        transfer_code: transferResp?.data?.transfer_code,
        recipient_code: recipientCode,
      })
      .select()
      .single();

    if (payoutError) {
      return apiInternalError("Failed to record payout");
    }

    return apiSuccess({ payout });
  } catch (error: unknown) {
    return apiInternalError(getErrorMessage(error, "Payout failed"));
  }
}
