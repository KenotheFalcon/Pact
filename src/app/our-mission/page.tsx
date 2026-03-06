"use client"

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Leaf, Handshake, Truck, Sprout, ShieldCheck, Users } from 'lucide-react'

export default function OurMissionPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-zinc-900">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-farm.jpg"
              alt="Pact - Our Mission"
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
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4"
            >
              Our <span className="bg-gradient-to-r from-pact-green to-emerald-300 bg-clip-text text-transparent">Mission</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg md:text-xl text-zinc-200 max-w-3xl mx-auto"
            >
              Empower farmers, delight buyers, and build a transparent, resilient food system.
            </motion.p>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Sprout,
                  title: 'Empower Producers',
                  desc: 'Give farmers tools to sell directly, plan better, and earn fairly.'
                },
                {
                  Icon: Handshake,
                  title: 'Connect Communities',
                  desc: 'Pool demand to reduce waste, stabilize prices, and strengthen trust.'
                },
                {
                  Icon: ShieldCheck,
                  title: 'Ensure Transparency',
                  desc: 'Traceable sourcing, clear pricing, and accountable logistics from farm to table.'
                }
              ].map(({ Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-20 bg-muted/50 px-4 border-t border-border/50">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative h-[380px] rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image src="/images/featured-yams.jpg" alt="Fresh produce" fill className="object-cover" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold text-primary mb-4">Real-World Impact</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  With Pact, farmers plan harvests with confidence and buyers access fresher, more affordable food. Together we reduce waste and deliver value for every stakeholder.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[{ label: 'Avg. Farmer Uplift', value: '+18%' }, { label: 'Waste Reduction', value: '-22%' }, { label: 'On-time Fulfilment', value: '96%' }, { label: 'Communities Served', value: '120+' }].map(({ label, value }) => (
                    <div key={label} className="bg-background border border-border/50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-primary">{value}</div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-primary mb-12">How Pact Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { Icon: Leaf, title: 'List Produce', desc: 'Farmers list seasonality, pricing, and availability with confidence.' },
                { Icon: Users, title: 'Pool Demand', desc: 'Buyers join group-buys to unlock fair, stable pricing.' },
                { Icon: Truck, title: 'Fulfil + Deliver', desc: 'Coordinated logistics bring fresh produce to pickup points.' },
              ].map(({ Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="text-center bg-card border border-border/60 rounded-xl p-6 shadow-sm"
                >
                  <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
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
