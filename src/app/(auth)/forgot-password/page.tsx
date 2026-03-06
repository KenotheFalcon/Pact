import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { MotionWrapper } from "@/components/MotionWrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/ui/submit-button"

import { forgotPassword } from "../actions"


export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
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
              Reset password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {searchParams.error && (
              <Alert variant="destructive" className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{searchParams.error}</AlertDescription>
              </Alert>
            )}
            {searchParams.success && (
              <Alert className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{searchParams.success}</AlertDescription>
              </Alert>
            )}
            <form action={forgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none text-foreground ml-1">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green transition-all h-12 rounded-xl"
                />
              </div>
              <SubmitButton
                loadingText="Sending..."
                className="w-full bg-pact-green hover:bg-pact-green/90 text-white shadow-lg shadow-pact-green/20 transition-all hover:scale-[1.02] h-12 rounded-xl text-base font-semibold"
              >
                Send Reset Link
              </SubmitButton>
            </form>
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
