'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'

interface AnimatedOrdersGridProps {
  children: ReactNode
  className?: string
}

/**
 * Client-side animated grid wrapper for order cards
 * Used in buyer dashboard to add stagger animation to order list
 */
export function AnimatedOrdersGrid({ children, className = '' }: AnimatedOrdersGridProps) {
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

interface AnimatedOrderCardProps {
  children: ReactNode
  className?: string
}

/**
 * Individual animated order card wrapper
 */
export function AnimatedOrderCard({ children, className = '' }: AnimatedOrderCardProps) {
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
