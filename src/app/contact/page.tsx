'use client'

import { motion } from 'framer-motion'
import { Send, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to send message')
            }

            setSubmitted(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="flex-1 container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                    <Card className="border-border shadow-lg bg-card">
                        <CardHeader className="text-center space-y-2">
                            <CardTitle className="text-3xl md:text-4xl font-bold">Contact Support</CardTitle>
                            <CardDescription>
                                Have an issue or question? Send us a message and we&apos;ll get back to you shortly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center space-y-4 py-8"
                                >
                                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">Message Sent!</h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            Thank you for reaching out. Our support team will review your message and respond within 24 hours.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSubmitted(false)}
                                        className="mt-4"
                                    >
                                        Send another message
                                    </Button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "form-error" : undefined}>
                                    {error && (
                                        <div 
                                            id="form-error"
                                            role="alert"
                                            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-600 dark:text-red-400"
                                        >
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                                        <Input id="name" name="name" placeholder="Your name" required />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                                        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                        <Input id="subject" name="subject" placeholder="What is this regarding?" required />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium">Message</label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Describe your issue in detail…"
                                            className="min-h-[120px]"
                                            required
                                        />
                                    </div>

                                    <LoadingButton
                                        type="submit"
                                        loading={isLoading}
                                        loadingText="Sending..."
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        <span className="flex items-center gap-2">
                                            Send Message <Send className="h-4 w-4" />
                                        </span>
                                    </LoadingButton>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
    )
}
