'use client'

import { motion } from 'framer-motion'
import { Users, Leaf, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'

interface Stat {
  label: string
  value: string
  icon: LucideIcon
}

const stats: Stat[] = [
  { label: "Farmers Connected", value: "12k+", icon: Users },
  { label: "Listings Published", value: "3.5k+", icon: Leaf },
  { label: "Active Pools", value: "800+", icon: Users },
  { label: "Transactions", value: "50k+", icon: TrendingUp },
]

export function StatsSection() {
  const prefersReducedMotion = useReducedMotion()

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } }

  return (
    <section className="relative overflow-hidden bg-muted py-16">
      {/* Top border gradient */}
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          {...revealProps}
          variants={staggerContainerVariants}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItemVariants}
              className="rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all duration-200 hover:shadow-elevated"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pact-green/10 text-pact-green">
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
