'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { slideUpVariants, cardHoverVariants } from '@/lib/animations'

const benefits = [
  {
    title: "Higher Profit Margins",
    description: "Cut out middlemen and sell directly to retailers and buyers",
  },
  {
    title: "Predictable Demand",
    description: "Know exactly how much buyers want before you harvest",
  },
  {
    title: "Simple Verification",
    description: "Quick registration and verification process to start listing",
  },
  {
    title: "Secure Payments",
    description: "Get paid directly to your account when pools complete",
  },
]

export function FarmersSection() {
  const prefersReducedMotion = useReducedMotion()

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-pact-green/5 to-background py-20 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5 dark:opacity-[0.03]" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center lg:gap-16">
          {/* Content */}
          <motion.div
            {...revealProps}
            variants={slideUpVariants}
            className="space-y-6"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pact-green">
                For Farmers
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Grow your farming business
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Reach verified buyers directly, eliminate middlemen, and earn better prices for your produce.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-pact-green" aria-hidden="true" />
                  <div>
                    <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/signup?role=farmer">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Register as Farmer
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            {...revealProps}
            variants={cardHoverVariants}
            className="relative h-80 w-full overflow-hidden rounded-2xl shadow-elevated md:h-96"
          >
            <Image
              src="/images/hero-farmer.jpg"
              alt="Farmer with fresh produce"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
