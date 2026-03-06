'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ShoppingBag, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { motion } from 'framer-motion'

function CheckoutSuccessContent() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
    const [message, setMessage] = useState<string>('Verifying your payment...')

    useEffect(() => {
        const reference = searchParams.get('reference')
        const poolId = searchParams.get('poolId')
        if (!reference || !poolId) {
            setStatus('error')
            setMessage('Missing payment reference or pool information')
            return
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}&poolId=${encodeURIComponent(poolId)}`)
                const data = await res.json()
                if (!data.success) {
                    throw new Error(data.error || 'Verification failed')
                }
                setStatus('success')
                setMessage('Payment verified successfully!')
            } catch (e: unknown) {
                setStatus('error')
                setMessage(e instanceof Error ? e.message : 'Payment verification failed')
            }
        }
        verify()
    }, [searchParams])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-green-200 dark:border-green-900 shadow-lg bg-green-50/50 dark:bg-green-950/10">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                {status === 'verifying' && <Loader2 className="h-10 w-10 animate-spin text-green-600 dark:text-green-400" />}
                                {status === 'success' && <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />}
                                {status === 'error' && <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />}
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {status === 'verifying' && 'Processing Payment'}
                                {status === 'success' && 'Order Confirmed!'}
                                {status === 'error' && 'Verification Issue'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">{message}</p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pt-6">
                            {status === 'success' ? (
                                <>
                                    <Link href="/buyer/orders" className="w-full">
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                            View My Orders <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/marketplace" className="w-full">
                                        <Button variant="outline" className="w-full border-green-200 hover:bg-green-100 dark:border-green-900 dark:hover:bg-green-900/20">
                                            Continue Shopping <ShoppingBag className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/" className="w-full">
                                        <Button variant="outline" className="w-full">Back Home</Button>
                                    </Link>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex flex-col">
                    <Navbar />
                    <main className="flex-1 container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
                        <Card className="w-full max-w-md">
                            <CardContent className="flex justify-center py-12">
                                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                            </CardContent>
                        </Card>
                    </main>
                    <Footer />
                </div>
            }
        >
            <CheckoutSuccessContent />
        </Suspense>
    )
}

