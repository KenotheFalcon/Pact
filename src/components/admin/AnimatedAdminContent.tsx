'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants, pageVariants } from '@/lib/animations'

interface AnimatedStatsGridProps {
  children: ReactNode
  className?: string
}

/**
 * Animated stats grid wrapper for admin dashboard
 * Provides stagger animation for stat cards
 */
export function AnimatedStatsGrid({ children, className = '' }: AnimatedStatsGridProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedStatCardProps {
  children: ReactNode
  className?: string
}

/**
 * Individual animated stat card wrapper
 */
export function AnimatedStatCard({ children, className = '' }: AnimatedStatCardProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  )
}

interface AnimatedAdminContentProps {
  children: ReactNode
  className?: string
}

/**
 * Page-level animation wrapper for admin content
 */
export function AnimatedAdminContent({ children, className = '' }: AnimatedAdminContentProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}
