'use client'
import { ArrowRight, Loader2, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { SecurityNotice } from "@/components/auth/SecurityNotice"
import { MotionWrapper } from "@/components/MotionWrapper"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInputWithStrength } from "@/components/ui/password-input-with-strength"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { signup } from "../actions"



import type { PasswordStrengthResult } from "@/lib/password-validation"


function SignupContent() {
    const searchParams = useSearchParams()

    const [role, setRole] = useState("buyer")
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const lastErrorRef = useRef<string | null>(null)

    // Read role from query params and surface server-action errors
    useEffect(() => {
        const roleFromQuery = searchParams.get('role')
        if (roleFromQuery === 'farmer' || roleFromQuery === 'buyer') {
            setRole(roleFromQuery)
        }
        
        const errorFromQuery = searchParams.get('error')
        if (errorFromQuery && errorFromQuery !== lastErrorRef.current) {
            lastErrorRef.current = errorFromQuery
            toast.error(errorFromQuery)
        }
    }, [searchParams])

    const handleSubmit = async (formData: FormData) => {
        // Block submission if password is weak
        if (passwordStrength && passwordStrength.label === 'weak') {
            toast.error('Please choose a stronger password')
            return
        }

        setIsSubmitting(true)
        try {
            await signup(formData)
        } catch (error) {
            setIsSubmitting(false)
            toast.error('Failed to create account')
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none bg-background">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pact-green/20 dark:bg-pact-green/10 blur-[120px] animate-pulse" />
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px]" />
            </div>

            <MotionWrapper className="w-full max-w-md relative z-10">
                <Card className="border-border bg-card backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/50">
                    <CardHeader className="space-y-1 text-center pb-8">
                        <CardTitle className="font-heading text-3xl font-bold tracking-tight text-foreground">Create an account</CardTitle>
                        <CardDescription className="text-muted-foreground text-base">
                            Enter your email below to create your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <SecurityNotice className="mb-4" />
                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium leading-none text-foreground ml-1">Full Name</label>
<Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    autoComplete="name"
                                    className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none text-foreground ml-1">Email</label>
<Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    autoComplete="email"
                                    className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium leading-none text-foreground ml-1">Password</label>
<PasswordInputWithStrength
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                    showStrengthIndicator={true}
                                    onStrengthChange={setPasswordStrength}
                                    className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor="role" className="text-sm font-medium leading-none text-foreground ml-1">I am a</label>
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-pact-green"
                                                    aria-label="Role information"
                                                >
                                                    <HelpCircle className="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="right"
                                                className="max-w-[280px] p-3 bg-card border border-border shadow-lg"
                                            >
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-semibold text-pact-green">Buyer:</span>
                                                        <span className="text-muted-foreground ml-1">
                                                            Join buying pools to purchase fresh produce at bulk prices. Perfect for households and small businesses.
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-pact-orange">Farmer:</span>
                                                        <span className="text-muted-foreground ml-1">
                                                            List your produce and reach more customers through pooled orders. Get better prices and reduce waste.
                                                        </span>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="relative">
                                    <select
                                        id="role"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground appearance-none"
                                    >
                                        <option value="buyer">Buyer</option>
                                        <option value="farmer">Farmer</option>
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                    </div>
                                </div>
                                {/* Role description hint */}
                                <p className="text-xs text-muted-foreground ml-1">
                                    {role === 'buyer' 
                                        ? 'Join pools to buy fresh produce at bulk prices'
                                        : 'Sell your produce directly to buyers through pools'
                                    }
                                </p>
                            </div>
<LoadingButton
                                type="submit" 
                                loading={isSubmitting}
                                loadingText="Creating Account..."
                                disabled={passwordStrength !== null && passwordStrength.label === 'weak'}
                                className="w-full bg-pact-green hover:bg-pact-green/90 text-white shadow-lg shadow-pact-green/20 h-12 rounded-xl text-base font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                            </LoadingButton>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background/50 px-2 text-muted-foreground backdrop-blur-sm rounded-full">Or continue with</span>
                            </div>
                        </div>

                        <GoogleSignInButton role={role} />
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-pact-green hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </MotionWrapper>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background transition-colors duration-300">
                    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none bg-background">
                        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pact-green/20 dark:bg-pact-green/10 blur-[120px]" />
                        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px]" />
                    </div>
                    <Card className="w-full max-w-md relative z-10">
                        <CardContent className="flex justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <SignupContent />
        </Suspense>
    )
}
