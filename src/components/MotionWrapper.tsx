'use client'

import { motion } from 'framer-motion'
import { ReactNode, useMemo } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface MotionWrapperProps {
    children: ReactNode
    className?: string
    delay?: number
}

export const MotionWrapper = ({ children, className = "", delay = 0 }: MotionWrapperProps) => {
    const prefersReducedMotion = useReducedMotion()
    
    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: Math.min(delay, 0.2), // Cap delay to max 200ms for faster paint
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
