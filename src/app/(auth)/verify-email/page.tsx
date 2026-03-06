'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { resendVerificationEmail } from "../actions"
import { useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect, useRef } from "react"
import { toast } from "sonner"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [email, setEmail] = useState("")
    const lastNotificationRef = useRef<string | null>(null)
    
    // Handle success/error messages from URL
    useEffect(() => {
        const errorFromQuery = searchParams.get('error')
        const successFromQuery = searchParams.get('success')
        
        if (errorFromQuery && errorFromQuery !== lastNotificationRef.current) {
            lastNotificationRef.current = errorFromQuery
            toast.error(errorFromQuery)
        }
        
        if (successFromQuery && successFromQuery !== lastNotificationRef.current) {
            lastNotificationRef.current = successFromQuery
            toast.success(successFromQuery)
        }
    }, [searchParams])

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            await resendVerificationEmail(formData)
        } catch {
            setIsSubmitting(false)
            toast.error('Failed to resend verification email')
        }
    }

    const success = searchParams.get('success')

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5 dark:opacity-[0.02] pointer-events-none" />
            <Card className="w-full max-w-md text-center relative z-10 border-border bg-card shadow-xl">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-6">
                        <div className={`rounded-full p-4 ring-1 ${success ? 'bg-green-500/10 ring-green-500/20' : 'bg-pact-green/10 ring-pact-green/20'}`}>
                            {success ? (
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : (
                                <Mail className="h-8 w-8 text-pact-green" />
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {success ? 'Email Sent!' : 'Check your email'}
                    </CardTitle>
                    <CardDescription className="text-zinc-600 dark:text-zinc-400 text-base">
                        {success 
                            ? 'A new verification link has been sent to your email.'
                            : "We've sent a verification link to your email address."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Please click the link in the email to verify your account and access the dashboard.
                    </p>
                    
                    <div className="border-t border-border pt-4 mt-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                            Didn&apos;t receive the email? Enter your email to resend.
                        </p>
                        <form action={handleSubmit} className="space-y-3">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50 border-input focus:ring-pact-green focus:border-pact-green transition-all h-11"
                                aria-describedby="resend-help"
                            />
                            <p id="resend-help" className="sr-only">
                                Enter the email address you used to sign up
                            </p>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !email}
                                className="w-full bg-pact-green hover:bg-pact-green/90 text-white h-11"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Resend Verification Email
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Button asChild variant="ghost" className="text-pact-green hover:text-pact-green hover:bg-pact-green/10 dark:hover:bg-pact-green/20">
                        <Link href="/login">
                            Back to Sign In
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
                    <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5 dark:opacity-[0.02] pointer-events-none" />
                    <Card className="w-full max-w-md text-center relative z-10 border-border bg-card shadow-xl">
                        <CardContent className="flex justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-pact-green" />
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    )
}
