'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp, CheckCircle2, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'

interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

const features: Feature[] = [
  {
    title: "Active Pools",
    description: "Collaborate with other retailers to buy directly from the farmer.",
    icon: Users,
  },
  {
    title: "Better Prices",
    description: "More profit margins for both retailer and farmer.",
    icon: TrendingUp,
  },
  {
    title: "Wide Range of Produce",
    description: "Access to different farm produce without intermediaries.",
    icon: CheckCircle2,
  },
  {
    title: "Fresh Food",
    description: "Retailers receive fresher produce thanks to shorter supply chains.",
    icon: Leaf,
  },
]

export function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion()

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } }

  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Why Pact?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for reliability, priced for fairness.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          {...revealProps}
          variants={staggerContainerVariants}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItemVariants}
              className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-card transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pact-green/10 text-pact-green transition-colors group-hover:bg-pact-green group-hover:text-white">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
