import { SupabaseClient } from "@supabase/supabase-js";
import { PaystackVerifyResponse } from "@/types/payment";

interface PaymentData {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata: Record<string, unknown>;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

class PaystackClient {
  private secretKey: string;
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || "";
  }

  setSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async initializePayment(
    data: PaymentData
  ): Promise<PaystackInitializeResponse> {
    try {
      const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      return result;
    } catch {
      return { status: false, message: "Payment initialization failed" };
    }
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch {
      return {
        status: false,
        message: "Payment verification failed",
      } as PaystackVerifyResponse;
    }
  }

  /**
   * Process successful payment by updating pool_members payment status
   * Note: The main payment flow uses the authorize_payment_atomically RPC.
   * This method is provided for webhook handling fallback.
   */
  async processSuccessfulPayment(verificationResult: PaystackVerifyResponse) {
    if (!this.supabase) {
      throw new Error("Supabase client not configured");
    }

    const reference = verificationResult.data.reference;

    // Update pool_members payment status
    const { data: member, error: memberError } = await this.supabase
      .from("pool_members")
      .update({ 
        payment_status: "authorized" as const,
      })
      .eq("payment_reference", reference)
      .select("pool_id, user_id, quantity_pledged")
      .single();

    if (memberError || !member) {
      throw new Error("Pool member not found for payment reference");
    }

    return { success: true, member };
  }

  /**
   * Handle payment failure by updating pool_members status
   */
  async handlePaymentFailure(reference: string) {
    if (!this.supabase) {
      throw new Error("Supabase client not configured");
    }

    const { error } = await this.supabase
      .from("pool_members")
      .update({ payment_status: "voided" as const })
      .eq("payment_reference", reference);

    if (error) {
      throw new Error("Failed to update payment failure status");
    }

    return { success: true };
  }
}

export const paystackClient = new PaystackClient();
