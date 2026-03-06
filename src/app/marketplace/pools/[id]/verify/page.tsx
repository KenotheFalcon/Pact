"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function VerifyPaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const poolId = params.id as string;
    const reference = searchParams.get("reference");

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("Verifying your payment…");

    useEffect(() => {
        if (!reference) {
            setStatus("error");
            setMessage("Invalid payment reference");
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch(`/api/payments/verify?reference=${reference}&poolId=${poolId}`);
                const result = await response.json();

                if (result.success) {
                    setStatus("success");
                    setMessage("Payment successful! You have joined the pool.");
                    toast.success("Payment verified successfully");
                } else {
                    setStatus("error");
                    setMessage(result.error || "Payment verification failed");
                    toast.error(result.error || "Payment verification failed");
                }
} catch {
                setStatus("error");
                setMessage("An unexpected error occurred");
            }
        };

        verify();
    }, [reference, poolId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-pact-green/5 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]" />
            </div>

            <Card className="w-full max-w-md text-center border-border bg-card/80 backdrop-blur-xl shadow-2xl relative z-10">
                <CardContent className="space-y-8 py-12 px-6">
                    {status === "verifying" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-pact-green/20 rounded-full blur-xl animate-pulse" />
                                <div className="relative bg-white dark:bg-zinc-800 p-4 rounded-full shadow-lg">
                                    <Loader2 className="w-12 h-12 animate-spin text-pact-green" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Processing Payment</h2>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-[250px] mx-auto">
                                    Please wait while we securely verify your transaction with Paystack...
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                                <div className="relative bg-white dark:bg-zinc-800 p-4 rounded-full shadow-lg border-2 border-green-100 dark:border-green-900">
                                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                                </div>
                            </motion.div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Success!</h2>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col w-full gap-3 pt-4">
                                <Button
                                    onClick={() => router.push(`/marketplace/pools/${poolId}`)}
                                    className="w-full bg-pact-green hover:bg-emerald-600 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-pact-green/20 transition-all hover:scale-[1.02]"
                                >
                                    Go to Pool <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mt-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Securely verified by Paystack</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <motion.div
                                initial={{ x: -10 }}
                                animate={{ x: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                                <div className="relative bg-white dark:bg-zinc-800 p-4 rounded-full shadow-lg border-2 border-red-100 dark:border-red-900">
                                    <XCircle className="w-16 h-16 text-red-500" />
                                </div>
                            </motion.div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Verification Failed</h2>
                                <p className="text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                                    {message}
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => router.push(`/marketplace/pools/${poolId}`)}
                                className="w-full h-12 rounded-xl border-border hover:bg-muted"
                            >
                                Return to Pool
                            </Button>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
