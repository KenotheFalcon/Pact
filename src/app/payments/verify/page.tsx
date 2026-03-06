'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Suspense } from 'react';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setMessage('Payment reference not found');
            return;
        }

        verifyPayment(reference);
    }, [reference]);

    const verifyPayment = async (ref: string) => {
        try {
            const response = await fetch(`/api/payments/verify?reference=${ref}`);
            const result = await response.json();

            if (result.success) {
                setStatus('success');
                setMessage(result.message || 'Payment verified successfully');
                setOrderId(result.data?.order_id || '');
            } else {
                setStatus('error');
                setMessage(result.error || 'Payment verification failed');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Failed to verify payment');
        }
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center">
                    {status === 'loading' && 'Verifying Payment...'}
                    {status === 'success' && 'Payment Successful!'}
                    {status === 'error' && 'Payment Failed'}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
                <div className="flex justify-center">
                    {status === 'loading' && (
                        <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    )}
                    {status === 'success' && (
                        <CheckCircle2 className="w-16 h-16 text-green-600" />
                    )}
                    {status === 'error' && (
                        <XCircle className="w-16 h-16 text-red-600" />
                    )}
                </div>

                <p className="text-muted-foreground">{message}</p>

                {orderId && (
                    <p className="text-sm text-muted-foreground">
                        Order ID: <span className="font-mono">{orderId}</span>
                    </p>
                )}

                <div className="flex flex-col gap-3">
                    {status === 'success' && (
                        <>
                            <Link href="/buyer/orders">
                                <Button className="w-full bg-primary hover:bg-primary/90">
                                    View My Orders
                                </Button>
                            </Link>
                            <Link href="/marketplace">
                                <Button variant="outline" className="w-full">
                                    Browse More Pools
                                </Button>
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <Link href="/marketplace">
                                <Button className="w-full bg-primary hover:bg-primary/90">
                                    Back to Marketplace
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function PaymentVerifyPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
            <div className="container mx-auto px-4">
                <Suspense fallback={
                    <Card className="max-w-md mx-auto">
                        <CardContent className="flex justify-center py-12">
                            <Loader2 className="w-16 h-16 animate-spin text-primary" />
                        </CardContent>
                    </Card>
                }>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
