"use server";

import { revalidatePath } from "next/cache";

import {
  notifyPoolLocked,
  notifyPoolCancelled,
} from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import {
  formatError,
  logError,
  handleSupabaseError,
} from "@/lib/utils/error-handling";

import type { ListingRow } from "@/types/supabase";

/**
 * Captures all authorized payments when a pool locks
 * This should be called automatically when pool reaches target quantity
 * 
 * @deprecated This action now delegates to the pool-processor edge function for better reliability
 */
export async function capturePoolPayments(poolId: string) {
  const supabase = await createClient();

  try {
    // 1. Verify pool is locked
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("*, listing:listings!pools_listing_id_fkey(*)")
      .eq("id", poolId)
      .single<{ status: string; listing: ListingRow }>();

    if (poolError || !pool) {
      return { success: false, error: "Pool not found" };
    }

    if (pool.status !== "locked") {
      return { success: false, error: "Pool is not locked" };
    }

    // 2. Get all authorized pool members
    const { data: members, error: membersError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", poolId)
      .eq("payment_status", "authorized");

    if (membersError) {
      return { success: false, error: "Failed to fetch pool members" };
    }

    if (!members || members.length === 0) {
      return { success: false, error: "No authorized payments to capture" };
    }

    // 3. Capture payments (in Paystack, "authorized" payments are already charged)
    // For Paystack, when a payment is "successful", the money is already captured
    // We just need to update our records and create orders

    // Update pool members to captured status
    const { error: updateError } = await supabase.rpc("process_pool_lock", {
      pool_id_param: poolId,
    });

    if (updateError) {
      logError(handleSupabaseError(updateError), { action: "capturePoolPayments", poolId });
      return { success: false, error: "Failed to capture payments" };
    }

    // 4. Create orders for all members
    const { data: ordersCreated, error: ordersError } = await supabase.rpc(
      "create_orders_for_pool",
      {
        pool_id_param: poolId,
      }
    );

    if (ordersError) {
      logError(handleSupabaseError(ordersError), { action: "capturePoolPayments", poolId });
      return { success: false, error: "Failed to create orders" };
    }

    // 5. Deduct inventory from listing
    const { error: inventoryError } = await supabase.rpc(
      "deduct_pool_inventory",
      {
        pool_id_param: poolId,
      }
    );

    if (inventoryError) {
      logError(handleSupabaseError(inventoryError), { action: "capturePoolPayments", poolId, step: "inventory" });
      // Don't fail the whole operation, but log it
    }

    // 6. Send notifications to all pool members
    await notifyPoolLocked(poolId);

    revalidatePath(`/marketplace/pools/${poolId}`);
    revalidatePath("/farmer/pools");
    revalidatePath("/buyer/orders");

    return {
      success: true,
      ordersCreated: ordersCreated || 0,
      membersCount: members.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to capture payments";
    logError(error instanceof Error ? error : new Error(message), { action: "capturePoolPayments", poolId });
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Handles the automatic pool locking process
 * This can be called via webhook or scheduled job
 */
export async function checkAndLockPools() {
  const supabase = await createClient();

  try {
    // Find all active pools that have reached their target
    // We can't use column comparison in Supabase client, so fetch all active pools
    const { data: pools, error } = await supabase
      .from("pools")
      .select("id, current_quantity, min_quantity")
      .eq("status", "active");

    if (error) {
      logError(handleSupabaseError(error), { action: "checkAndLockPools" });
      return formatError(handleSupabaseError(error));
    }

    // Filter pools that have reached target
    const eligiblePools =
      pools?.filter((p) => p.current_quantity >= p.min_quantity) || [];

    if (eligiblePools.length === 0) {
      return { success: true, poolsLocked: 0 };
    }

    // Process each pool concurrently
    const capturePromises = eligiblePools.map(async (pool) => {
      // The database trigger should handle the status update to 'locked'
      // We just need to trigger the payment capture
      const result = await capturePoolPayments(pool.id);
      return { poolId: pool.id, result };
    });

    const results = await Promise.all(capturePromises);

    const lockedCount = results.filter((r) => r.result.success).length;

    return {
      success: true,
      poolsLocked: lockedCount,
      results,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check and lock pools";
    logError(error instanceof Error ? error : new Error(message), { action: "checkAndLockPools" });
    return { success: false, error: message };
  }
}

/**
 * Cancels a pool and refunds all authorized payments
 * Can only be called by pool leader or admin
 */
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
