// Notification helper functions for specific events

import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendNotification, getEmailTemplate, NotificationType } from "./email";

/**
 * Notify user when they join a pool
 */
export async function notifyPoolJoined(
  poolId: string,
  userId: string,
  quantity: number,
  amount: number
) {
  const supabase = await createServerClient();

  try {
    // Get user and pool details
    const { data: user } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    const { data: pool } = await supabase
      .from("pools")
      .select(
        `
        *,
        listing:listings!pools_listing_id_fkey (
          name,
          unit,
          price_per_unit
        )
      `
      )
      .eq("id", poolId)
      .single();

    if (!user || !pool) return;

    const progressPercent = Math.round(
      (pool.current_quantity / pool.min_quantity) * 100
    );

    const { subject, html } = getEmailTemplate("pool_joined", {
      listingName: pool.listing.name,
      quantity,
      unit: pool.listing.unit,
      amount,
      currentQuantity: pool.current_quantity,
      targetQuantity: pool.min_quantity,
      progressPercent,
      poolId,
    });

    await sendNotification(
      supabase,
      userId,
      user.email,
      "pool_joined",
      { subject, html },
      {
        title: "Joined Pool Successfully",
        message: `You've joined the pool for ${pool.listing.name}`,
        metadata: { poolId, quantity, amount },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify farmer when payout is processed
 */
export async function notifyPoolLocked(poolId: string) {
  const supabase = await createServerClient();

  try {
    // Get pool and members
    const { data: pool } = await supabase
      .from("pools")
      .select(
        `
        *,
        listing:listings!pools_listing_id_fkey (name, unit)
      `
      )
      .eq("id", poolId)
      .single();

    const { data: members } = await supabase
      .from("pool_members")
      .select(
        `
        *,
        user:profiles!pool_members_user_id_fkey (email, display_name)
      `
      )
      .eq("pool_id", poolId)
      .eq("payment_status", "captured");

    if (!pool || !members || members.length === 0) return;

    // Batch insert in-app notifications for all members (fixes N+1)
    const notifications = members.map((member) => ({
      user_id: member.user_id,
      type: "pool_locked",
      title: "Pool Locked!",
      message: `The pool for ${pool.listing.name} has been locked`,
      metadata: { poolId },
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("notifications").insert(notifications);

    // Send emails in parallel (non-blocking)
    const emailPromises = members.map(async (member) => {
      try {
        const { subject, html } = getEmailTemplate("pool_locked", {
          listingName: pool.listing.name,
          totalQuantity: pool.current_quantity,
          unit: pool.listing.unit,
          userQuantity: member.quantity_pledged,
          amount: member.amount_pledged,
        });

        // Call edge function for email only
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            userId: member.user_id,
            userEmail: member.user.email,
            type: "pool_locked",
            emailData: { subject, html },
            inAppData: null, // Skip in-app - already batched above
          }),
        });
      } catch {
        // Individual email failures shouldn't break the batch
      }
    });

    await Promise.allSettled(emailPromises);
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify user of successful payment
 */
export async function notifyPaymentSuccessful(
  userId: string,
  reference: string,
  amount: number,
  orderId: string,
  listingName: string
) {
  const supabase = await createServerClient();

  try {
    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!user) return;

    const { subject, html } = getEmailTemplate("payment_successful", {
      amount,
      reference,
      orderId,
      listingName,
    });

    await sendNotification(
      supabase,
      userId,
      user.email,
      "payment_successful",
      { subject, html },
      {
        title: "Payment Successful",
        message: `Your payment of ₦${amount.toLocaleString()} has been processed`,
        metadata: { reference, orderId, amount },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify user of successful payment
 */
export async function notifyPaymentFailed(
  userId: string,
  reference: string,
  poolId: string,
  reason?: string
) {
  const supabase = await createServerClient();

  try {
    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!user) return;

    const { subject, html } = getEmailTemplate("payment_failed", {
      reference,
      poolId,
      reason,
    });

    await sendNotification(
      supabase,
      userId,
      user.email,
      "payment_failed",
      { subject, html },
      {
        title: "Payment Failed",
        message: "Your payment could not be processed",
        metadata: { reference, poolId, reason },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify farmer and buyer when order is confirmed
 */
export async function notifyOrderConfirmed(orderId: string) {
  const supabase = await createServerClient();

  try {
    const { data: order } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:profiles!orders_buyer_id_fkey (email, display_name),
        listing:listings!orders_listing_id_fkey (
          name,
          unit,
          farmer_id,
          farmer:profiles!listings_farmer_id_fkey (email, display_name)
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (!order) return;

    // Notify buyer
    const { subject, html } = getEmailTemplate("order_confirmed", {
      orderId,
      listingName: order.listing.name,
      quantity: order.quantity,
      unit: order.listing.unit,
      farmerName: order.listing.farmer.display_name,
      estimatedDelivery: "Within 3-5 days",
    });

    await sendNotification(
      supabase,
      order.buyer_id,
      order.buyer.email,
      "order_confirmed",
      { subject, html },
      {
        title: "Order Confirmed",
        message: `Your order for ${order.listing.name} has been confirmed`,
        metadata: { orderId },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify farmer when listing is created
 */
export async function notifyListingCreated(
  listingId: string,
  farmerId: string
) {
  const supabase = await createServerClient();

  try {
    const { data: listing } = await supabase
      .from("listings")
      .select("*, farmer:profiles!listings_farmer_id_fkey (email)")
      .eq("id", listingId)
      .single();

    if (!listing) return;

    const { subject, html } = getEmailTemplate("listing_created", {
      listingName: listing.name,
      price: listing.price_per_unit,
      unit: listing.unit,
      quantity: listing.quantity,
      listingId,
    });

    await sendNotification(
      supabase,
      farmerId,
      listing.farmer.email,
      "listing_created",
      { subject, html },
      {
        title: "Listing Published",
        message: `Your listing "${listing.name}" is now live`,
        metadata: { listingId },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify pool members when pool is cancelled
 * Uses batch insert for in-app notifications to fix N+1 query issue
 */
export async function notifyPoolCancelled(poolId: string, reason?: string) {
  const supabase = await createServerClient();

  try {
    const { data: pool } = await supabase
      .from("pools")
      .select(
        `
        *,
        listing:listings!pools_listing_id_fkey (name)
      `
      )
      .eq("id", poolId)
      .single();

    const { data: members } = await supabase
      .from("pool_members")
      .select(
        `
        user_id,
        user:profiles!pool_members_user_id_fkey (email)
      `
      )
      .eq("pool_id", poolId);

    if (!pool || !members || members.length === 0) return;

    // Batch insert in-app notifications (fixes N+1)
    const notifications = members.map((member) => ({
      user_id: member.user_id,
      type: "pool_cancelled",
      title: "Pool Cancelled",
      message: `The pool for ${pool.listing.name} has been cancelled`,
      metadata: { poolId, reason },
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("notifications").insert(notifications);

    // Send emails in parallel
    const emailPromises = members.map(async (member) => {
      try {
        const memberEmail = Array.isArray(member.user)
          ? (member.user as { email: string }[])[0]?.email
          : (member.user as { email: string } | null)?.email;

        if (!memberEmail) return;

        const { subject, html } = getEmailTemplate("pool_cancelled", {
          listingName: pool.listing.name,
          reason,
        });

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            userId: member.user_id,
            userEmail: memberEmail,
            type: "pool_cancelled",
            emailData: { subject, html },
            inAppData: null,
          }),
        });
      } catch {
        // Individual failures shouldn't break the batch
      }
    });

    await Promise.allSettled(emailPromises);
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify farmer when stock is low
 */
export async function notifyLowStock(listingId: string) {
  const supabase = await createServerClient();

  try {
    const { data: listing } = await supabase
      .from("listings")
      .select(
        `
        *,
        farmer:profiles!listings_farmer_id_fkey (email)
      `
      )
      .eq("id", listingId)
      .single();

    if (!listing) return;

    const { subject, html } = getEmailTemplate("listing_low_stock", {
      listingName: listing.name,
      remainingQuantity: listing.quantity,
      unit: listing.unit,
      listingId,
    });

    await sendNotification(
      supabase,
      listing.farmer_id,
      listing.farmer.email,
      "listing_low_stock",
      { subject, html },
      {
        title: "Low Stock Alert",
        message: `${listing.name} is running low on stock`,
        metadata: { listingId, quantity: listing.quantity },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify user of failed payment
 */
export async function notifyVerificationApproved(userId: string, role: string) {
  const supabase = await createServerClient();

  try {
    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!user) return;

    const { subject, html } = getEmailTemplate("verification_approved", {
      role,
    });

    await sendNotification(
      supabase,
      userId,
      user.email,
      "verification_approved",
      { subject, html },
      {
        title: "Account Verified!",
        message: "Your account has been successfully verified",
        metadata: { role },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}

/**
 * Notify user when account is verified
 */
export async function notifyPayoutProcessed(
  userId: string,
  amount: number,
  reference: string
) {
  const supabase = await createServerClient();

  try {
    const { data: user } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    if (!user) return;

    const { subject, html } = getEmailTemplate("payout_processed", {
      amount,
      reference,
      userName: user.display_name || "Farmer",
    });

    await sendNotification(
      supabase,
      userId,
      user.email,
      "payout_processed",
      { subject, html },
      {
        title: "Payout Processed",
        message: `Your payout of ₦${(
          amount / 100
        ).toLocaleString()} has been processed`,
        metadata: { reference, amount },
      }
    );
  } catch {
    // Silently fail - notifications are not critical
  }
}
