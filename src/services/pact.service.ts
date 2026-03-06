import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "./payment.service";
import { PoolFilters } from "@/types/database";
import { generatePaymentReference } from "@/lib/payments/paystack";

// Error code to user-friendly message mapping for pool reservation
const RESERVE_ERROR_MESSAGES: Record<string, string> = {
  "45000": "Pool capacity exceeded",
  "22023": "Invalid quantity",
};

/**
 * Translate Supabase RPC error to user-friendly message
 */
function getReserveErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code && RESERVE_ERROR_MESSAGES[error.code]) {
    return RESERVE_ERROR_MESSAGES[error.code];
  }
  return error.message || "Failed to reserve pool spot";
}

export class PactService {
  /**
   * Create a new Pool (Pact)
   */
  static async createPool(data: {
    listingId: string;
    leaderId: string;
    minQuantity: number;
    expiresAt: string;
    latitude?: number;
    longitude?: number;
  }) {
    const supabase = await createClient();

    // Validate Listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("quantity, price_per_unit")
      .eq("id", data.listingId)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    // Create Pool
    const { data: pool, error } = await supabase
      .from("pools")
      .insert({
        listing_id: data.listingId,
        leader_id: data.leaderId,
        min_quantity: data.minQuantity,
        current_quantity: 0,
        expires_at: data.expiresAt,
        status: "active",
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return pool;
  }

  /**
   * Join a Pool via RPC (Atomic Reservation)
   */
  static async joinPool(
    poolId: string,
    userId: string,
    quantity: number,
    userEmail: string
  ) {
    const supabase = await createClient();

    // 1) Fetch listing price to compute payment amount
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(
        `
        listing:listings (
          price_per_unit
        )
      `
      )
      .eq("id", poolId)
      .single();

    if (poolError || !pool || !pool.listing) {
      throw new Error("Pool data retrieval failed");
    }

    const listing = (Array.isArray(pool.listing) ? pool.listing[0] : pool.listing) as { price_per_unit: number };
    const amount = listing.price_per_unit * quantity;

    // 2) Generate reference upfront so reservation and payment share it
    const reference = generatePaymentReference("PACT");

    // 3) Atomic reservation with capacity check & reference binding
    const { error: reserveError } = await supabase.rpc("reserve_pool_membership", {
      pool_id_param: poolId,
      user_id_param: userId,
      quantity_param: quantity,
      amount_naira: amount,
      reference_param: reference,
    });

    if (reserveError) {
      throw new Error(getReserveErrorMessage(reserveError));
    }

    // 4) Initialize payment with the same reference
    const paymentResponse = await PaymentService.initializeTransaction(
      userId,
      userEmail,
      amount,
      {
        type: "pool_join",
        pool_id: poolId,
        quantity,
      },
      reference
    );

    return paymentResponse;
  }

  /**
   * Get Pool Details
   */
  static async getPoolDetails(poolId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pools")
      .select(
        `
        *,
        listing:listings (*),
        leader:profiles!pools_leader_id_fkey (*),
        members:pool_members (
          *,
          user:profiles (*)
        )
      `
      )
      .eq("id", poolId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Search Pools with Filters
   */
  static async searchPools(filters: PoolFilters) {
    const supabase = await createClient();

    let query = supabase
      .from("pools")
      .select(
        `
        *,
        listing:listings!inner (
          name,
          category,
          price_per_unit,
          unit,
          images
        )
      `
      )
      .eq("status", "active");

    if (filters.category) {
      query = query.eq("listing.category", filters.category);
    }

    // Latitude/Longitude Logic would ideally use PostGIS RPC,
    // but for simple bounding box or client-side sorting:
    // We'll leave basic filtering here.

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get Pool Chat Messages
   */
  static async getPoolChatMessages(poolId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pool_chat")
      .select(
        `
        *,
        user:profiles (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("pool_id", poolId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Send Chat Message
   */
  static async sendChatMessage(
    poolId: string,
    userId: string,
    message: string
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pool_chat")
      .insert({
        pool_id: poolId,
        user_id: userId,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
