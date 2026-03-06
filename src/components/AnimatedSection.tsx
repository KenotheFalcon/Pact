'use client'

import { motion } from 'framer-motion'
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimatedSectionProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

/**
 * Wrapper component for sections with stagger animations
 * Animates children with a stagger effect
 */
export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
    const prefersReducedMotion = useReducedMotion()

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainerVariants}
            transition={{ delay }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Individual item wrapper for stagger animations
 */
export function AnimatedItem({ children, className }: { children: React.ReactNode; className?: string }) {
    const prefersReducedMotion = useReducedMotion()

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div className={className} variants={staggerItemVariants}>
            {children}
        </motion.div>
    )
}
