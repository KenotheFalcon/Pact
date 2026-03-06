'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimatedProgressProps {
    value: number
    max: number
    className?: string
    showPercentage?: boolean
}

/**
 * Animated progress bar component
 */
export function AnimatedProgress({
    value,
    max,
    className = '',
    showPercentage = false,
}: AnimatedProgressProps) {
    const prefersReducedMotion = useReducedMotion()
    const percentage = Math.min(100, Math.round((value / max) * 100))

    const getColor = (percent: number) => {
        if (percent >= 80) return 'bg-primary'
        if (percent >= 50) return 'bg-accent'
        return 'bg-gray-500'
    }

    return (
        <div className={`w-full ${className}`}>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                {prefersReducedMotion ? (
                    <div
                        className={`h-3 rounded-full ${getColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                    />
                ) : (
                    <motion.div
                        className={`h-3 rounded-full ${getColor(percentage)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                            duration: 1,
                            ease: [0.6, -0.05, 0.01, 0.99],
                        }}
                    />
                )}
            </div>
            {showPercentage && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                    {value} / {max} ({percentage}%)
                </p>
            )}
        </div>
    )
}
