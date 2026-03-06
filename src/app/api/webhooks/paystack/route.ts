import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * POST /api/webhooks/paystack
 * 
 * @deprecated This route now redirects to the Supabase Edge Function for better reliability.
 * Update Paystack webhook URL to: https://your-project.supabase.co/functions/v1/paystack-webhook
 * 
 * Keeping this route as a fallback proxy during migration.
 */
export async function POST(request: NextRequest) {
  // Note: This endpoint is deprecated - update webhook URL to Edge Function
  try {
    // Proxy to edge function
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/paystack-webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": signature || "",
        },
        body: body,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  }
}
