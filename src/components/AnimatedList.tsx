'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'

interface AnimatedListProps {
  children: ReactNode[]
  className?: string
}

/**
 * Animated list container with stagger effect for children
 * Use for order lists, card grids, and any list that should animate in
 */
export function AnimatedList({ children, className = '' }: AnimatedListProps) {
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
      {children.map((child, index) => (
        <motion.div key={index} variants={staggerItemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  layoutId?: string
}

/**
 * Individual animated list item with exit animation support
 * Use with AnimatePresence for add/remove animations
 */
export function AnimatedListItem({ children, className = '', layoutId }: AnimatedListItemProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedPageContentProps {
  children: ReactNode
  className?: string
}

/**
 * Page-level entrance animation wrapper
 * Use as the root wrapper for page content to get fade-in + slide-up effect
 */
export function AnimatedPageContent({ children, className = '' }: AnimatedPageContentProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.6, -0.05, 0.01, 0.99] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export { AnimatePresence }
