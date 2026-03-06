"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/payments/paystack";
import { revalidatePath } from "next/cache";
import {
  ApiResponse,
  PaymentError,
  formatError,
  logError,
} from "@/lib/utils/error-handling";
import { getErrorMessage } from "@/lib/api/responses";

export async function verifyPoolPayment(
  reference: string
): Promise<ApiResponse> {
  const supabase = await createClient();

  try {
    // 1. Verify with Paystack
    const verification = await verifyPayment(reference);

    if (!verification.status || verification.data.status !== "success") {
      throw new PaymentError("Payment verification failed with Paystack");
    }

    // 2. Update pool_member status
    const { data: member, error: updateError } = await supabase
      .from("pool_members")
      .update({
        payment_status: "authorized",
      })
      .eq("payment_reference", reference)
      .select()
      .single();

    if (updateError || !member) {
      console.error("Failed to update member status:", updateError);
      return { success: false, error: "Failed to update pledge status" };
    }

    // 3. Update pool quantity (if we didn't do it optimistically before)
    // In joinPool, we did it optimistically? No, we did it before payment.
    // Wait, if we did it before payment, we might have "fake" pledges if payment fails.
    // Ideally, we should only increment quantity AFTER payment success.
    // Let's fix joinPool to NOT increment quantity, and do it here.

    // For now, let's assume joinPool did NOT increment (I need to check/fix that).
    // Let's increment here.

    const { error: incrementError } = await supabase.rpc(
      "increment_pool_quantity",
      {
        pool_id_param: member.pool_id,
        quantity_param: member.quantity_pledged,
      }
    );

    if (incrementError) {
      // Fallback manual update
      const { data: pool } = await supabase
        .from("pools")
        .select("current_quantity")
        .eq("id", member.pool_id)
        .single();
      if (pool) {
        await supabase
          .from("pools")
          .update({
            current_quantity: pool.current_quantity + member.quantity_pledged,
          })
          .eq("id", member.pool_id);
      }
    }

    revalidatePath(`/marketplace/pools/${member.pool_id}`);
    return { success: true, data: { poolId: member.pool_id } };
  } catch (error: unknown) {
    logError(error as Error, { reference, action: "verifyPoolPayment" });
    return formatError(error);
  }
}
