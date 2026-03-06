// Email notification service using Resend (or can be swapped with SendGrid, Mailgun, etc.)

import { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | "pool_created"
  | "pool_joined"
  | "pool_locked"
  | "pool_completed"
  | "pool_cancelled"
  | "pool_expiring_soon"
  | "payment_successful"
  | "payment_failed"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "listing_created"
  | "listing_low_stock"
  | "payout_processed"
  | "review_received"
  | "verification_approved"
  | "verification_rejected";

/**
 * Send email notification via edge function
 * @deprecated Direct email sending - now uses edge function for better reliability
 */
export async function sendEmail(
  notification: EmailNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          userEmail: notification.to,
          userId: "unknown", // For backward compatibility
          type: "generic",
          emailData: {
            subject: notification.subject,
            html: notification.html,
          },
          inAppData: {
            title: notification.subject,
            message: "Email notification",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send email");
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Create in-app notification in database
 */
export async function createNotification(
  supabase: SupabaseClient,
  data: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Failed to create notification",
    };
  }
}

/**
 * Send notification (both email and in-app) via edge function
 * This now delegates to the send-notification edge function for better reliability
 */
export async function sendNotification(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  type: NotificationType,
  emailData: { subject: string; html: string },
  inAppData: {
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ emailSent: boolean; inAppCreated: boolean }> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          userId,
          userEmail,
          type,
          emailData,
          inAppData,
        }),
      }
    );

    if (!response.ok) {
      return { emailSent: false, inAppCreated: false };
    }

    const result = await response.json();
    return {
      emailSent: result.emailSent || false,
      inAppCreated: result.inAppCreated || false,
    };
  } catch {
    return { emailSent: false, inAppCreated: false };
  }
}

/**
 * Get email template for notification type
 */
export function getEmailTemplate(
  type: NotificationType,
  data: Record<string, unknown>
): { subject: string; html: string } {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const templates: Record<
    NotificationType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => { subject: string; html: string }
  > = {
    pool_locked: (data) => {
      const d = data as Record<string, unknown>;
      return {
        subject: `🎉 Pool Locked: ${d.listingName}`,
        html: `
        <h2>Great News! Your Pool is Locked 🎉</h2>
        <p>The pool for <strong>${
          d.listingName
        }</strong> has reached its target quantity and is now locked!</p>
        <p><strong>Total Pool Quantity:</strong> ${d.totalQuantity}${
        d.unit
      }</p>
        <p><strong>Your Contribution:</strong> ${d.userQuantity}${
        d.unit
      }</p>
        <p><strong>Amount:</strong> ₦${Number(d.amount).toLocaleString()}</p>
        <p>Your payment has been captured and your order is being processed.</p>
        <p><a href="${baseUrl}/buyer/orders" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Your Order</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Thank you for supporting local farmers!</p>
      `,
      };
    },

    pool_joined: (data) => ({
      subject: `✅ Successfully Joined Pool: ${data.listingName}`,
      html: `
        <h2>Welcome to the Pool! ✅</h2>
        <p>You've successfully joined the pool for <strong>${
          data.listingName
        }</strong>.</p>
        <p><strong>Your Pledge:</strong> ${data.quantity}${data.unit}</p>
        <p><strong>Amount Authorized:</strong> ₦${data.amount.toLocaleString()}</p>
        <p><strong>Pool Progress:</strong> ${data.currentQuantity}/${
        data.targetQuantity
      }${data.unit} (${data.progressPercent}%)</p>
        <p>Your payment has been authorized. It will only be charged once the pool reaches its target.</p>
        <p><a href="${baseUrl}/marketplace/pools/${
        data.poolId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Track Pool Progress</a></p>
      `,
    }),

    payment_successful: (data) => ({
      subject: `💳 Payment Successful: ₦${data.amount.toLocaleString()}`,
      html: `
        <h2>Payment Confirmed! 💳</h2>
        <p>Your payment of <strong>₦${data.amount.toLocaleString()}</strong> has been successfully processed.</p>
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Item:</strong> ${data.listingName}</p>
        <p><a href="${baseUrl}/buyer/orders/${
        data.orderId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Order Details</a></p>
      `,
    }),

    payment_failed: (data) => ({
      subject: `❌ Payment Failed`,
      html: `
        <h2>Payment Unsuccessful ❌</h2>
        <p>Unfortunately, your payment could not be processed.</p>
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Reason:</strong> ${data.reason || "Payment declined"}</p>
        <p>Please try again or use a different payment method.</p>
        <p><a href="${baseUrl}/marketplace/pools/${
        data.poolId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Try Again</a></p>
      `,
    }),

    order_confirmed: (data) => ({
      subject: `📦 Order Confirmed: ${data.listingName}`,
      html: `
        <h2>Order Confirmed! 📦</h2>
        <p>Your order has been confirmed by the farmer.</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Item:</strong> ${data.listingName}</p>
        <p><strong>Quantity:</strong> ${data.quantity}${data.unit}</p>
        <p><strong>Farmer:</strong> ${data.farmerName}</p>
        <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        <p><a href="${baseUrl}/buyer/orders/${data.orderId}" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Track Order</a></p>
      `,
    }),

    pool_completed: (data) => ({
      subject: `🎊 Pool Completed: ${data.listingName}`,
      html: `
        <h2>Pool Successfully Completed! 🎊</h2>
        <p>Great news! Your pool for <strong>${data.listingName}</strong> has been completed.</p>
        <p><strong>Total Participants:</strong> ${data.participantCount}</p>
        <p><strong>Total Quantity:</strong> ${data.totalQuantity}${data.unit}</p>
        <p>Orders are now being prepared for delivery. You'll receive updates as your order progresses.</p>
        <p><a href="${baseUrl}/buyer/orders" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Your Orders</a></p>
      `,
    }),

    pool_cancelled: (data) => ({
      subject: `❌ Pool Cancelled: ${data.listingName}`,
      html: `
        <h2>Pool Cancelled</h2>
        <p>Unfortunately, the pool for <strong>${
          data.listingName
        }</strong> has been cancelled.</p>
        <p><strong>Reason:</strong> ${data.reason || "Not specified"}</p>
        <p>Any authorized payments will be voided and no charges will be made.</p>
        <p><a href="${baseUrl}/marketplace" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Browse Other Pools</a></p>
      `,
    }),

    listing_created: (data) => ({
      subject: `✅ Listing Created: ${data.listingName}`,
      html: `
        <h2>Listing Published! ✅</h2>
        <p>Your listing for <strong>${
          data.listingName
        }</strong> is now live on the marketplace.</p>
        <p><strong>Price:</strong> ₦${data.price.toLocaleString()}/${
        data.unit
      }</p>
        <p><strong>Available Quantity:</strong> ${data.quantity}${data.unit}</p>
        <p><a href="${baseUrl}/marketplace/listings/${
        data.listingId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Listing</a></p>
      `,
    }),

    listing_low_stock: (data) => ({
      subject: `⚠️ Low Stock Alert: ${data.listingName}`,
      html: `
        <h2>Low Stock Alert ⚠️</h2>
        <p>Your listing <strong>${data.listingName}</strong> is running low on stock.</p>
        <p><strong>Remaining:</strong> ${data.remainingQuantity}${data.unit}</p>
        <p>Consider restocking to continue receiving orders.</p>
        <p><a href="${baseUrl}/farmer/listings/${data.listingId}" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Update Inventory</a></p>
      `,
    }),

    verification_approved: (data) => ({
      subject: `🎉 Account Verified!`,
      html: `
        <h2>Congratulations! Your Account is Verified 🎉</h2>
        <p>Your ${data.role} account has been successfully verified.</p>
        <p>You now have full access to all platform features.</p>
        ${
          data.role === "farmer"
            ? `<p><a href="${baseUrl}/farmer/listings/create" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Create Your First Listing</a></p>`
            : ""
        }
      `,
    }),

    verification_rejected: (data) => ({
      subject: `Verification Update`,
      html: `
        <h2>Verification Status Update</h2>
        <p>We were unable to verify your account at this time.</p>
        <p><strong>Reason:</strong> ${
          data.reason || "Incomplete information"
        }</p>
        <p>Please contact support for assistance: support@pactmarket.ng</p>
      `,
    }),

    pool_expiring_soon: (data) => ({
      subject: `⏰ Pool Expiring Soon: ${data.listingName}`,
      html: `
        <h2>Pool Expiring Soon! ⏰</h2>
        <p>The pool for <strong>${data.listingName}</strong> expires in ${data.hoursRemaining} hours.</p>
        <p><strong>Current Progress:</strong> ${data.currentQuantity}/${data.targetQuantity}${data.unit} (${data.progressPercent}%)</p>
        <p>Join now before it's too late!</p>
        <p><a href="${baseUrl}/marketplace/pools/${data.poolId}" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Join Pool</a></p>
      `,
    }),

    pool_created: (data) => ({
      subject: `🌱 New Pool Created: ${data.listingName}`,
      html: `
        <h2>New Pool Available! 🌱</h2>
        <p>A new pool has been created for <strong>${
          data.listingName
        }</strong>.</p>
        <p><strong>Price:</strong> ₦${data.price.toLocaleString()}/${
        data.unit
      }</p>
        <p><strong>Target:</strong> ${data.targetQuantity}${data.unit}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><a href="${baseUrl}/marketplace/pools/${
        data.poolId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Join Pool</a></p>
      `,
    }),

    order_shipped: (data) => ({
      subject: `🚚 Order Shipped: ${data.listingName}`,
      html: `
        <h2>Order On Its Way! 🚚</h2>
        <p>Your order has been shipped.</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Tracking:</strong> ${data.trackingNumber || "N/A"}</p>
        <p><a href="${baseUrl}/buyer/orders/${
        data.orderId
      }" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Track Order</a></p>
      `,
    }),

    order_delivered: (data) => ({
      subject: `✅ Order Delivered: ${data.listingName}`,
      html: `
        <h2>Order Delivered! ✅</h2>
        <p>Your order has been delivered.</p>
        <p>We hope you enjoy your fresh produce!</p>
        <p><a href="${baseUrl}/buyer/orders/${data.orderId}/review" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Leave a Review</a></p>
      `,
    }),

    order_cancelled: (data) => ({
      subject: `❌ Order Cancelled`,
      html: `
        <h2>Order Cancelled</h2>
        <p>Your order has been cancelled.</p>
        <p><strong>Reason:</strong> ${data.reason || "Not specified"}</p>
        <p>Any payments will be refunded within 5-7 business days.</p>
      `,
    }),

    payout_processed: (data) => ({
      subject: `💰 Payout Processed: ₦${data.amount.toLocaleString()}`,
      html: `
        <h2>Payout Processed! 💰</h2>
        <p>Your payout of <strong>₦${data.amount.toLocaleString()}</strong> has been processed.</p>
        <p><strong>Account:</strong> ${data.bankAccount}</p>
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p>Funds should arrive in your account within 24 hours.</p>
        <p><a href="${baseUrl}/farmer/earnings" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View Earnings</a></p>
      `,
    }),

    review_received: (data) => ({
      subject: `⭐ New Review Received`,
      html: `
        <h2>New Review! ⭐</h2>
        <p>You've received a new ${data.rating}-star review.</p>
        <p><strong>From:</strong> ${data.buyerName}</p>
        <p><strong>Comment:</strong> "${data.comment}"</p>
        <p><a href="${baseUrl}/farmer/reviews" style="background-color: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">View All Reviews</a></p>
      `,
    }),
  };

  const template = templates[type];
  return template
    ? template(data)
    : { subject: "Notification", html: "<p>You have a new notification.</p>" };
}
