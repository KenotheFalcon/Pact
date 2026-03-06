import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthError {
  message: string
  code?: string
}

export const signUp = async (email: string, password: string, displayName: string, role: 'buyer' | 'farmer') => {
  try {
    const supabase = createClient()
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user?.id,
          email,
          display_name: displayName,
          role,
          email_verified: false,
          preferences: {},
        } as never,
      ])

    if (profileError) throw profileError

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

export const signOut = async () => {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as AuthError }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

export const updateProfile = async (userId: string, updates: Record<string, unknown>) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as AuthError }
  }
}

export const resetPassword = async (email: string) => {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as AuthError }
  }
}