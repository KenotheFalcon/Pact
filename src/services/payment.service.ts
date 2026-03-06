import { createClient } from "@/lib/supabase/server";
import {
  initializePayment as paystackInitialize,
  verifyPayment as paystackVerify,
  generatePaymentReference,
  toKobo,
} from "@/lib/payments/paystack";
import { PaystackInitializeData } from "@/types/payment";

export class PaymentService {
  /**
   * Initialize a split payment transaction (95% Farmer / 5% Platform)
   */
  static async initializeTransaction(
    userId: string,
    email: string,
    amount: number,
    metadata: Record<string, unknown>,
    referenceOverride?: string
  ) {
    const reference = referenceOverride ?? generatePaymentReference("PACT");

    // Calculate split (Future implementation: Paystack Subaccounts)
    // For now, we just log the intended split
    const farmerShare = amount * 0.95;
    const platformShare = amount * 0.05;

    const paymentData: PaystackInitializeData = {
      email,
      amount: toKobo(amount),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?reference=${reference}`,
      metadata: {
        ...metadata,
        user_id: userId,
        custom_fields: [
          {
            display_name: "Platform Fee",
            variable_name: "platform_fee",
            value: platformShare.toString(),
          },
        ],
      },
    };

    try {
      const response = await paystackInitialize(paymentData);
      return {
        ...response,
        reference,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Payment initialization failed: ${message}`);
    }
  }

  /**
   * Verify a transaction and update local status
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await paystackVerify(reference);

      if (response.data.status === "success") {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        status: response.data.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Payment verification failed: ${message}`);
    }
  }
}
