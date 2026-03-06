/**
 * Health check endpoint for network status detection
 * Used by useNetworkStatus hook to verify connectivity
 */

export async function HEAD() {
  return new Response(null, { status: 200 })
}

export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
