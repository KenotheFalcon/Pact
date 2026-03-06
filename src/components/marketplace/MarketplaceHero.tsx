'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';

export function MarketplaceHero() {
    return (
        <div className="relative bg-zinc-950 overflow-hidden min-h-[500px] flex items-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-pact-green/90 via-emerald-900 to-zinc-950 opacity-95"></div>

            {/* Animated Shapes */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 50, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pact-orange/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"
            />

            <div className="relative container mx-auto px-4 py-20 sm:py-28 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4 text-pact-orange" />
                        <span>Fresh pools added daily</span>
                    </div>
                    <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
                        Join Forces. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-white">Save More.</span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p className="text-lg sm:text-xl md:text-2xl text-emerald-50/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        Team up with your neighbors to unlock wholesale prices on fresh, local produce directly from farmers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-center gap-4"
                >
                    <Button
                        size="lg"
                        variant="secondary"
                        className="font-bold text-pact-green bg-white hover:bg-emerald-50 shadow-xl shadow-black/20 text-lg px-8 py-6 rounded-full transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-900/20"
                        onClick={() => {
                            document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Browse Pools
                        <ArrowDown className="ml-2 w-5 h-5" />
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
