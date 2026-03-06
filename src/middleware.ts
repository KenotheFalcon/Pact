import { NextResponse, type NextRequest } from "next/server";

import { refreshSession, getUserWithRole } from "@/lib/supabase/middleware";

/**
 * MIDDLEWARE: Authentication & Rate Limiting
 *
 * Responsibilities:
 * 1. Refresh user session via Supabase
 * 2. Apply rate limiting per IP
 * 3. Pass user context to request headers (for Server Components)
 * 4. Route protection by role (farmer, buyer, admin)
 */

// ===== RATE LIMITING =====
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // max 60 requests per window
const CLEANUP_THRESHOLD = 8_000; // Cleanup when reaching this many entries

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();
let lastCleanup = Date.now();

// Cleanup stale entries to prevent memory leak
function cleanupStaleEntries(): void {
  const now = Date.now();
  // Only cleanup every 30 seconds at most
  if (now - lastCleanup < 30_000) return;
  
  counters.forEach((counter, key) => {
    if (counter.resetAt <= now) {
      counters.delete(key);
    }
  });
  lastCleanup = now;
}

function rateLimitKey(req: NextRequest): string {
  const ip =
    req.ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const path = new URL(req.url).pathname;
  const scope = path.startsWith("/api/") ? "api" : "web";
  return `${scope}:${ip}`;
}

function checkRateLimit(req: NextRequest): {
  allowed: boolean;
  remaining: number;
  reset: number;
} {
  // Periodic cleanup to prevent memory leak
  if (counters.size > CLEANUP_THRESHOLD) {
    cleanupStaleEntries();
  }

  const key = rateLimitKey(req);
  const now = Date.now();
  const current = counters.get(key);
  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      reset: RATE_LIMIT_WINDOW_MS,
    };
  }
  if (current.count < RATE_LIMIT_MAX) {
    current.count += 1;
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - current.count,
      reset: current.resetAt - now,
    };
  }
  return { allowed: false, remaining: 0, reset: current.resetAt - now };
}

// ===== ROUTE PROTECTION =====
const PROTECTED_ROUTES = [
  "/farmer",
  "/buyer",
  "/admin",
  "/checkout",
  "/dashboard",
];

export async function middleware(request: NextRequest) {
  // Skip rate limiting for health checks
  if (new URL(request.url).pathname === "/health") {
    return NextResponse.json({ ok: true });
  }

  // Apply rate limiting
  const { allowed, remaining, reset } = checkRateLimit(request);
  if (!allowed) {
    const res = NextResponse.json(
      { success: false, error: "Too Many Requests" },
      { status: 429 }
    );
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(reset / 1000)));
    return res;
  }

  // Refresh session cookies (lightweight — no DB call)
  const { response, supabase } = await refreshSession(request);

  const pathname = new URL(request.url).pathname;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isFarmerRoute = pathname.startsWith("/farmer");
  const isBuyerRoute = pathname.startsWith("/buyer");
  const isAdminRoute = pathname.startsWith("/admin");

  const withRateHeaders = (res: NextResponse) => {
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(reset / 1000)));
    return res;
  };

  // Only call getUser() + profile query for protected routes
  if (!isProtected) {
    return withRateHeaders(response);
  }

  const { user, userRole } = await getUserWithRole(supabase);

  // Unauthenticated guard
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withRateHeaders(NextResponse.redirect(url));
  }

  // Role-based guards
  if (user) {
    const role = userRole || "buyer";

    if (isFarmerRoute && role !== "farmer") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/marketplace";
      return withRateHeaders(NextResponse.redirect(url));
    }

    if (isBuyerRoute) {
      if (role === "farmer") {
        const url = request.nextUrl.clone();
        url.pathname = "/farmer";
        return withRateHeaders(NextResponse.redirect(url));
      }
      if (role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return withRateHeaders(NextResponse.redirect(url));
      }
    }

    if (isAdminRoute && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "farmer" ? "/farmer" : "/marketplace";
      return withRateHeaders(NextResponse.redirect(url));
    }
  }

  return withRateHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
