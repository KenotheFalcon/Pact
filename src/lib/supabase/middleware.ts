import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import type { User } from '@supabase/supabase-js'

/**
 * Lightweight session refresh: creates a Supabase server client that
 * reads/writes auth cookies. Does NOT call getUser() or query the DB.
 * This keeps public-route latency near zero.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  return { response, supabase }
}

/**
 * Full auth check: calls getUser() (Supabase Auth API) and fetches role
 * from the profiles table. Only call this for protected routes.
 */
export async function getUserWithRole(
  supabase: ReturnType<typeof createServerClient>
): Promise<{ user: User | null; userRole: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || 'buyer'
  }

  return { user, userRole }
}
