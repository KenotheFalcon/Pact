import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiError, apiInternalError } from "@/lib/api/responses";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CRON_SECRET = process.env.CRON_SECRET!;

/**
 * GET /api/cron/process-pools
 * 
 * Triggers the pool-processor edge function
 * This route can be called by external cron services (e.g., cron-job.org, EasyCron)
 * 
 * @deprecated Use Supabase edge function directly for better reliability
 * Endpoint: https://your-project.supabase.co/functions/v1/pool-processor
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.nextUrl.searchParams.get("secret");

    if (authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
      return apiUnauthorized("Invalid cron secret");
    }

    // Call the edge function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/pool-processor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return apiError("Pool processor failed: " + (data.message || "Unknown error"), response.status);
    }

    return apiSuccess(data);
  } catch (error: unknown) {
    return apiInternalError(error instanceof Error ? error.message : "Failed to trigger pool processor");
  }
}
