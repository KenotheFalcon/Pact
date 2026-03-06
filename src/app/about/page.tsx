'use client'

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { motion } from 'framer-motion'
import { Leaf, Users, Globe, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-zinc-900">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/hero-farm.jpg"
                            alt="Sustainable Farming"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-zinc-950" />
                        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10 mix-blend-overlay" />
                    </div>

                    <div className="container relative z-10 text-center px-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
                        >
                            Revolutionizing <span className="bg-gradient-to-r from-pact-green to-emerald-300 bg-clip-text text-transparent">Agriculture</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto"
                        >
                            Connecting farmers directly with buyers through technology, transparency, and trust.
                        </motion.p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-20 px-4">
                    <div className="container mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <h2 className="text-3xl font-bold text-primary mb-6">Our Mission</h2>
                                <p className="text-lg text-muted-foreground mb-4">
                                    At Pact, we believe that the future of food is decentralized and direct. We are building the digital infrastructure to empower smallholder farmers and provide consumers with fresh, traceable produce.
                                </p>
                                <p className="text-lg text-muted-foreground">
                                    By eliminating middlemen and leveraging pooling power, we ensure fair prices for farmers and affordability for families.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <Image
                                    src="/images/featured-yams.jpg"
                                    alt="Fresh Produce"
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Values Grid */}
                <section className="py-20 bg-muted/50 px-4 border-t border-border/50">
                    <div className="container mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Core Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: Leaf, title: "Sustainability", desc: "Promoting eco-friendly farming practices." },
                                { icon: Users, title: "Community", desc: "Building strong networks of trust." },
                                { icon: Globe, title: "Accessibility", desc: "Making fresh food available to everyone." },
                                { icon: ShieldCheck, title: "Transparency", desc: "Clear pricing and traceable sourcing." }
                            ].map((value, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                                >
                                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                                        <value.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                                    <p className="text-muted-foreground">{value.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
