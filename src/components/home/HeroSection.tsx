'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { slideUpVariants, transitions } from '@/lib/animations'

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-120px" } }

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-pact-dark">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="relative h-full w-full"
          initial={prefersReducedMotion ? undefined : { scale: 1.05, opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1, transition: transitions.slow }}
        >
          <Image
            src="/images/hero-farmer.jpg"
            alt="Farmer holding fresh produce"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </motion.div>
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-pact-dark" />
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center">
        <motion.div
          {...revealProps}
          variants={slideUpVariants}
          className="flex flex-col items-center gap-6"
        >
          <Badge variant="success" className="border-white/15 bg-white/10 px-4 py-1.5 text-white backdrop-blur">
            Revolutionizing Agriculture in Africa
          </Badge>

          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Fresh-er Food{' '}
            <span className="bg-gradient-to-r from-pact-green to-emerald-300 bg-clip-text text-transparent">
              Fair-er Prices
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-zinc-200 md:text-xl">
            Precision agriculture meets community buying power. Connect directly with farmers for fresh, locally-sourced produce at wholesale prices.
          </p>

          <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
            <Link href="/marketplace">
              <Button size="xl" className="gap-2">
                Browse Marketplace
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="xl" variant="outline" className="border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10">
                How Pact Works
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center text-white/60"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: { ...transitions.normal, repeat: Infinity, repeatType: "reverse" } }}
      >
        <div className="flex h-10 w-6 items-center justify-center rounded-full border border-white/30 p-1">
          <div className="h-1.5 w-1 rounded-full bg-white/60" />
        </div>
        <span className="mt-2 text-xs font-medium uppercase tracking-[0.2em]">Scroll</span>
      </motion.div>
    </section>
  )
}
