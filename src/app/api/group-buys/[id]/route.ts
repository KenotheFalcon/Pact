// Legacy pool detail/join endpoint: redirect to /api/pools/[id]
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  url.pathname = `/api/pools/${params.id}`;
  return NextResponse.redirect(url, { status: 308 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  url.pathname = `/api/pools/${params.id}`;
  return NextResponse.redirect(url, { status: 308 });
}
