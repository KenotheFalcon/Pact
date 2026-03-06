// supabase/functions/pool-auto-lock/index.ts
// Edge Function: Auto-lock pools that reach target or expire
// Trigger: Scheduled via Supabase cron (recommended: every 5 minutes)
// Example cron: `select cron.schedule('pool-auto-lock', '*/5 * * * *', 'select net.http_post(''https://<PROJECT>.supabase.co/functions/v1/pool-auto-lock'', json_build_object(''secret'', ''<CRON_SECRET>''), timeout => interval ''10s'');');`

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface PoolLockRequest {
  secret?: string;
}

const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export async function handler(
  req: Request
): Promise<Response> {
  // Verify cron secret
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({})) as PoolLockRequest;
    if (!CRON_SECRET || body.secret !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Find active pools that have reached min_quantity or are expired
    const { data: pools, error: poolError } = await supabase
      .from("pools")
      .select("id, listing_id, min_quantity, current_quantity, expires_at, status")
      .eq("status", "active");

    if (poolError) {
      console.error("Error fetching pools:", poolError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch pools", details: poolError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!pools || pools.length === 0) {
      return new Response(
        JSON.stringify({ success: true, poolsProcessed: 0, message: "No active pools" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const poolsToLock = pools.filter(
      (p) =>
        p.current_quantity >= p.min_quantity || (p.expires_at && p.expires_at <= now)
    );

    if (poolsToLock.length === 0) {
      return new Response(
        JSON.stringify({ success: true, poolsProcessed: 0, message: "No pools ready to lock" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Process each pool
    const results = [];
    for (const pool of poolsToLock) {
      try {
        // Call process_pool_lock
        const { error: lockError } = await supabase.rpc("process_pool_lock", {
          pool_id_param: pool.id,
        });

        if (lockError) {
          console.error(`Error locking pool ${pool.id}:`, lockError);
          results.push({ poolId: pool.id, status: "error", error: lockError.message });
          continue;
        }

        // Call create_orders_for_pool
        const { error: ordersError } = await supabase.rpc("create_orders_for_pool", {
          pool_id_param: pool.id,
        });

        if (ordersError) {
          console.error(`Error creating orders for pool ${pool.id}:`, ordersError);
          results.push({ poolId: pool.id, status: "partial", error: ordersError.message });
          continue;
        }

        // Call deduct_pool_inventory
        const { error: inventoryError } = await supabase.rpc("deduct_pool_inventory", {
          pool_id_param: pool.id,
        });

        if (inventoryError) {
          console.error(`Error deducting inventory for pool ${pool.id}:`, inventoryError);
          results.push({ poolId: pool.id, status: "partial", error: inventoryError.message });
          continue;
        }

        // Call auto_generate_payouts to create farmer payout record
        const { data: payoutData, error: payoutError } = await supabase.rpc(
          "auto_generate_payouts",
          { pool_id_param: pool.id, platform_fee_percent: 5.0 }
        );

        if (payoutError) {
          console.error(`Error generating payout for pool ${pool.id}:`, payoutError);
          results.push({
            poolId: pool.id,
            status: "partial",
            error: `Payout generation failed: ${payoutError.message}`,
          });
          continue;
        }

        results.push({
          poolId: pool.id,
          status: "success",
          payoutReference: payoutData?.[0]?.reference || null,
        });
      } catch (err) {
        console.error(`Unexpected error processing pool ${pool.id}:`, err);
        results.push({ poolId: pool.id, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        poolsProcessed: poolsToLock.length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handler for Supabase edge functions
Deno.serve(handler);
