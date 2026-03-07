import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import { login } from "../actions"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { MotionWrapper } from "@/components/MotionWrapper"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none bg-pact-gray dark:bg-pact-dark">
        <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pact-green/10 to-emerald-300/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent blur-[120px]" />
      </div>

      <MotionWrapper className="w-full max-w-md relative z-10">
        <Card className="border-none bg-background/80 backdrop-blur-2xl shadow-float dark:bg-card/80 p-2">
          <CardHeader className="space-y-2 text-center pb-8 pt-6">
            <CardTitle className="font-heading text-4xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground/80 text-base font-medium">
              Enter your email to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6">
            {searchParams.error && (
              <Alert 
                variant="destructive" 
                className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                id="login-error"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{searchParams.error}</AlertDescription>
              </Alert>
            )}
            <form action={login} className="space-y-5" aria-describedby={searchParams.error ? "login-error" : undefined}>
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="bg-white/50 dark:bg-black/50"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground ml-1">Password</label>
                  <Link href="/forgot-password" className="text-sm text-pact-green hover:text-pact-green/80 hover:underline font-semibold transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="bg-white/50 dark:bg-black/50"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg mt-2">
                Sign In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-medium">
                <span className="bg-background/80 px-3 py-1 text-muted-foreground backdrop-blur-md rounded-full border border-border/30">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton />
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-pact-green hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </MotionWrapper>
    </div>
  )
}