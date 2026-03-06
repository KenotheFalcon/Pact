'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { PasswordInputWithStrength } from "@/components/ui/password-input-with-strength"
import { LoadingButton } from "@/components/ui/loading-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'
import { MotionWrapper } from "@/components/MotionWrapper"
import type { PasswordStrengthResult } from "@/lib/password-validation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    if (passwordStrength && passwordStrength.label === 'weak') {
      setError('Please choose a stronger password')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      setError(updateError.message || 'Failed to update password')
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none bg-background">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pact-green/20 dark:bg-pact-green/10 blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px]" />
      </div>

      <MotionWrapper className="w-full max-w-md relative z-10">
        <Card className="border-border bg-card backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/50">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Set new password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert 
                variant="destructive" 
                className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                id="reset-password-error"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Password updated! Redirecting to login...</AlertDescription>
              </Alert>
            )}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={error ? "reset-password-error" : undefined}>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none text-foreground ml-1">New Password</label>
                  <PasswordInputWithStrength
                    id="password"
                    name="password"
                    required
                    showStrengthIndicator={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onStrengthChange={setPasswordStrength}
                    className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green transition-all h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium leading-none text-foreground ml-1">Confirm Password</label>
                  <PasswordInputWithStrength
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    showStrengthIndicator={false}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green transition-all h-12 rounded-xl"
                  />
                </div>
                <LoadingButton 
                  type="submit" 
                  loading={isLoading}
                  loadingText="Updating…"
                  disabled={passwordStrength !== null && passwordStrength.label === 'weak'}
                  className="w-full bg-pact-green hover:bg-pact-green/90 text-white shadow-lg shadow-pact-green/20 transition-all hover:scale-[1.02] h-12 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Password
                </LoadingButton>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-2">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </MotionWrapper>
    </div>
  )
}
