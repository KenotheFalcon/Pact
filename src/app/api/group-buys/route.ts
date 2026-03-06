// Legacy pools endpoint: redirect to /api/pools
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = "/api/pools";
  return NextResponse.redirect(url, { status: 308 });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = "/api/pools";
  return NextResponse.redirect(url, { status: 308 });
}
