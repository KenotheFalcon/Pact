'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { motion } from 'framer-motion'

export default function CheckoutCancelPage() {
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
                    <Card className="border-red-200 dark:border-red-900 shadow-lg bg-red-50/50 dark:bg-red-950/10">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">Payment Cancelled</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                Your payment was not completed. No charges have been made to your account.
                            </p>
                            <div className="bg-background/50 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground">
                                <p>If you encountered an issue, please try again or contact support.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pt-6">
                            <Link href="/checkout" className="w-full">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Return to Cart <ShoppingCart className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/contact" className="w-full">
                                <Button variant="outline" className="w-full">
                                    Contact Support <ArrowLeft className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
