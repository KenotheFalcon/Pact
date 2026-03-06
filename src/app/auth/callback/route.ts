import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDestinationForRole } from '@/lib/auth/roles'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing-user`)
      }
      
      // If a role was provided via OAuth initiation, persist it to profile
      if (roleParam === 'farmer' || roleParam === 'buyer') {
        await supabase
          .from('profiles')
          .update({ role: roleParam })
          .eq('id', user.id)
      }

      // Handle password reset redirect
      if (next === '/reset-password') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }

      // Fetch the latest role and onboarding status from profiles as source of truth
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single()

      const role = (profile?.role as string | undefined) ?? 'buyer'
      
      // Farmers who haven't completed onboarding should go to onboarding page
      if (role === 'farmer' && !profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/farmer/onboarding', origin))
      }
      
      const destination = getDestinationForRole(role)
      return NextResponse.redirect(new URL(destination, origin))
    }
  }

  // Return the user to an error page with instructions
  const errorDescription = searchParams.get('error_description')
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorDescription || 'Unknown error')}`)
}
