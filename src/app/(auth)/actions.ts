'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getDestinationForRole } from '@/lib/auth/roles'

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message = encodeURIComponent(error.message || 'Could not authenticate user')
    redirect(`/login?error=${message}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  // Get role from profiles table (primary source of truth)
  let role = 'buyer' // default
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role) {
      role = profile.role
    }
  }

  revalidatePath('/', 'layout')
  const destination = getDestinationForRole(role)
  redirect(destination)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const roleRaw = formData.get('role') as string
  
  // Security: Whitelist allowed roles for public signup
  const role = (roleRaw === 'farmer') ? 'farmer' : 'buyer'; 

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    // Bubble the exact Supabase error back to the UI for easier debugging
    const message = encodeURIComponent(error.message || 'Could not create user')
    redirect(`/signup?error=${message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/verify-email')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/reset-password`,
  })

  if (error) {
    const message = encodeURIComponent(error.message || 'Could not send reset email')
    redirect(`/forgot-password?error=${message}`)
  }

  const successMessage = encodeURIComponent('Check your email for a password reset link')
  redirect(`/forgot-password?success=${successMessage}`)
}

export async function resendVerificationEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    redirect('/verify-email?error=' + encodeURIComponent('Email is required'))
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    const message = encodeURIComponent(error.message || 'Could not resend verification email')
    redirect(`/verify-email?error=${message}`)
  }

  const successMessage = encodeURIComponent('Verification email sent! Please check your inbox.')
  redirect(`/verify-email?success=${successMessage}`)
}
