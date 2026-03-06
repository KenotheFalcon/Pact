"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getErrorMessage } from "@/lib/api/responses";
import { notifyPoolCancelled } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import {
  ApiResponse,
  AuthenticationError,
  formatError,
  handleSupabaseError,
  logError,
} from "@/lib/utils/error-handling";
import { PactService } from "@/services/pact.service";

export async function joinPool(
  poolId: string,
  quantity: number
): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("Please log in to join a pool");
    }

    const result = await PactService.joinPool(
      poolId,
      user.id,
      quantity,
      user.email || "customer@example.com"
    );

    return {
      success: true,
      data: {
        authorizationUrl: result.data.authorization_url,
        reference: result.reference,
      },
    };
  } catch (error: unknown) {
    console.error("Join pool error:", error);
    return formatError(error);
  }
}

export async function createPool(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const listingId = formData.get("listingId") as string;
  const minQuantity = Number(formData.get("minQuantity"));
  const expiresAt = formData.get("expiresAt") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!listingId || !minQuantity || !expiresAt) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    const pool = await PactService.createPool({
      listingId,
      leaderId: user.id,
      minQuantity,
      expiresAt,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
    });

    revalidatePath("/marketplace");
    revalidatePath("/farmer/pools");
    return { success: true, poolId: pool.id };
  } catch (error: unknown) {
    console.error("Error creating pool:", error);
    return { success: false, error: getErrorMessage(error, "Failed to create pool") };
  }
}

export async function cancelPool(poolId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Get pool details
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("*, leader:profiles!pools_leader_id_fkey(*)")
      .eq("id", poolId)
      .single();

    if (poolError || !pool) {
      return { success: false, error: "Pool not found" };
    }

    // 2. Check authorization (must be leader or admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pool.leader_id !== user.id && profile?.role !== "admin") {
      return { success: false, error: "Unauthorized to cancel this pool" };
    }

    if (pool.status !== "active") {
      return { success: false, error: "Can only cancel active pools" };
    }

    // 3. Update pool status to cancelled
    const { error: updateError } = await supabase
      .from("pools")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", poolId);

    if (updateError) {
      return { success: false, error: "Failed to cancel pool" };
    }

    // 4. Void all authorized payments
    const { error: voidError } = await supabase
      .from("pool_members")
      .update({ payment_status: "voided" })
      .eq("pool_id", poolId)
      .in("payment_status", ["pending", "authorized"]);

    if (voidError) {
      logError(handleSupabaseError(voidError), { action: "cancelPool", poolId, step: "voidPayments" });
    }

    // 5. Process refunds for captured payments via Paystack
    // NOTE: Refund processing requires:
    // - Paystack "Refunds" API integration (POST /refund)
    // - Transaction reference from original payment
    // - Business verification on Paystack dashboard
    // Implementation:
    // const { refundPayment } = await import('@/lib/payments/paystack');
    // const capturedMembers = await supabase
    //   .from('pool_members')
    //   .select('payment_reference, amount_pledged')
    //   .eq('pool_id', poolId)
    //   .eq('payment_status', 'captured');
    // for (const member of capturedMembers.data || []) {
    //   await refundPayment(member.payment_reference, member.amount_pledged);
    // }

    // 6. Send notifications to all members
    await notifyPoolCancelled(poolId, reason);

    revalidatePath(`/marketplace/pools/${poolId}`);
    revalidatePath("/marketplace");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logError(error instanceof Error ? error : new Error(message), { action: "cancelPool", poolId });
    return { success: false, error: message };
  }
}
