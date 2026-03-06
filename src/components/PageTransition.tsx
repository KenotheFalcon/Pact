'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { 
    pageVariants, 
    pageSlideVariants, 
    pageFadeVariants, 
    pageScaleVariants 
} from '@/lib/animations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type TransitionMode = 'default' | 'slide' | 'fade' | 'scale'

interface PageTransitionProps {
    children: React.ReactNode
    /** Animation mode for the transition */
    mode?: TransitionMode
    /** Custom animation variants (overrides mode) */
    variants?: Variants
    /** Additional CSS classes */
    className?: string
}

const VARIANT_MAP: Record<TransitionMode, Variants> = {
    default: pageVariants,
    slide: pageSlideVariants,
    fade: pageFadeVariants,
    scale: pageScaleVariants,
}

/**
 * Wrapper component for smooth page transitions
 * Automatically handles route changes with animations
 * 
 * @example
 * // Default slide-up animation
 * <PageTransition>{children}</PageTransition>
 * 
 * @example
 * // Horizontal slide animation
 * <PageTransition mode="slide">{children}</PageTransition>
 */
export function PageTransition({ 
    children, 
    mode = 'default',
    variants,
    className 
}: PageTransitionProps) {
    const pathname = usePathname()
    const prefersReducedMotion = useReducedMotion()

    // Disable animations if user prefers reduced motion
    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>
    }

    const selectedVariants = variants ?? VARIANT_MAP[mode]

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={selectedVariants}
                className={className ?? 'w-full min-h-screen'}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * Simplified fade transition for content sections
 */
export function FadeTransition({ 
    children, 
    className 
}: { 
    children: React.ReactNode
    className?: string 
}) {
    return <PageTransition mode="fade" className={className}>{children}</PageTransition>
}

/**
 * Scale transition for modal-like content
 */
export function ScaleTransition({ 
    children, 
    className 
}: { 
    children: React.ReactNode
    className?: string 
}) {
    return <PageTransition mode="scale" className={className}>{children}</PageTransition>
}
