'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Shield, Leaf, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { slideUpVariants } from '@/lib/animations'

const trustTags = [
  { label: "Escrow-backed pools", icon: Shield },
  { label: "Farm freshness", icon: Leaf },
  { label: "Transparent pricing", icon: TrendingUp },
]

export function TrustSection() {
  const prefersReducedMotion = useReducedMotion()

  const revealProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } }

  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div {...revealProps} variants={slideUpVariants}>
          <Card className="grid gap-10 overflow-hidden border-pact-green/10 bg-gradient-to-r from-pact-green/5 via-background to-background p-6 md:grid-cols-2 md:items-center md:p-10">
            {/* Content */}
            <div className="space-y-5">
              <Badge variant="success" className="bg-pact-green/10 text-pact-green">
                Reliability First
              </Badge>
              <h3 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Zero guesswork, only verified farmers.
              </h3>
              <p className="text-muted-foreground">
                We verify sellers, monitor pool integrity, and enforce payout and delivery milestones to protect both farmers and buyers.
              </p>
              
              {/* Trust Tags */}
              <div className="flex flex-wrap gap-3">
                {trustTags.map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-2 rounded-full bg-pact-green/10 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    <tag.icon className="h-4 w-4 text-pact-green" aria-hidden="true" />
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-2xl md:h-72">
              <Image
                src="/images/hero-farmer.jpg"
                alt="Verified farmer in the field"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/20 to-transparent" />
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
